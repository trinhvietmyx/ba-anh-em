-- Phase 3 review schema for PostgreSQL 17. Apply only to an empty review database.
-- Production migrations and seed data are separate deliverables.

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
CREATE SCHEMA ba_anh_em;
SET LOCAL search_path = ba_anh_em, public;

CREATE TABLE venues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    time_zone text NOT NULL CHECK (btrim(time_zone) <> '')
);

CREATE TABLE dining_areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    code text NOT NULL CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    display_order integer NOT NULL DEFAULT 0,
    UNIQUE (venue_id, code),
    UNIQUE (venue_id, id)
);

CREATE TABLE dining_tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    area_id uuid NOT NULL,
    code text NOT NULL CHECK (btrim(code) <> ''),
    seats integer NOT NULL CHECK (seats > 0),
    active boolean NOT NULL DEFAULT true,
    FOREIGN KEY (venue_id, area_id) REFERENCES dining_areas (venue_id, id),
    UNIQUE (venue_id, code),
    UNIQUE (venue_id, id)
);

CREATE TABLE service_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    iso_weekday smallint NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
    effective_dates daterange NOT NULL CHECK (
        NOT isempty(effective_dates) AND NOT lower_inf(effective_dates)
    ),
    opens_at time NOT NULL CHECK (opens_at < TIME '24:00'),
    closes_at time NOT NULL CHECK (closes_at < TIME '24:00'),
    ends_next_day boolean NOT NULL,
    CHECK (
        (NOT ends_next_day AND closes_at > opens_at)
        OR (ends_next_day AND closes_at < opens_at)
    ),
    UNIQUE (venue_id, iso_weekday, effective_dates, opens_at, closes_at, ends_next_day)
);

CREATE TABLE service_day_overrides (
    venue_id uuid NOT NULL REFERENCES venues (id),
    service_date date NOT NULL CHECK (isfinite(service_date)),
    is_closed boolean NOT NULL,
    PRIMARY KEY (venue_id, service_date)
);

CREATE TABLE service_override_windows (
    venue_id uuid NOT NULL,
    service_date date NOT NULL,
    opens_at time NOT NULL CHECK (opens_at < TIME '24:00'),
    closes_at time NOT NULL CHECK (closes_at < TIME '24:00'),
    ends_next_day boolean NOT NULL,
    PRIMARY KEY (venue_id, service_date, opens_at),
    FOREIGN KEY (venue_id, service_date)
        REFERENCES service_day_overrides (venue_id, service_date),
    CHECK (
        (NOT ends_next_day AND closes_at > opens_at)
        OR (ends_next_day AND closes_at < opens_at)
    )
);

CREATE TABLE menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    public_key text NOT NULL CHECK (
        length(public_key) <= 120 AND public_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
    name text NOT NULL CHECK (btrim(name) <> ''),
    category text NOT NULL CHECK (btrim(category) <> ''),
    description text NOT NULL DEFAULT '',
    image_url text,
    price_vnd bigint NOT NULL CHECK (price_vnd BETWEEN 0 AND 9007199254740991),
    published boolean NOT NULL DEFAULT false,
    available boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (venue_id, public_key),
    UNIQUE (venue_id, id)
);

CREATE TABLE staff_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    oidc_issuer text NOT NULL CHECK (btrim(oidc_issuer) <> ''),
    oidc_subject text NOT NULL CHECK (btrim(oidc_subject) <> ''),
    display_name text NOT NULL CHECK (btrim(display_name) <> ''),
    active boolean NOT NULL DEFAULT true,
    UNIQUE (oidc_issuer, oidc_subject)
);

CREATE TABLE staff_venue_grants (
    staff_user_id uuid NOT NULL REFERENCES staff_users (id),
    venue_id uuid NOT NULL REFERENCES venues (id),
    permission text NOT NULL CHECK (permission IN (
        'menu.read', 'menu.write',
        'reservations.read', 'reservations.read_contact', 'reservations.read_audit',
        'reservations.write_events',
        'floorplan.read', 'floorplan.allocate', 'kitchen.read',
        'deposits.read', 'deposits.reconcile', 'reports.read'
    )),
    PRIMARY KEY (staff_user_id, venue_id, permission)
);

CREATE TABLE staff_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id uuid NOT NULL REFERENCES staff_users (id),
    token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
    created_at timestamptz NOT NULL DEFAULT now(),
    idle_expires_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CHECK (created_at < idle_expires_at AND idle_expires_at <= expires_at)
);

CREATE TABLE guest_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CHECK (created_at < expires_at)
);

CREATE TABLE reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    public_reference text NOT NULL CHECK (
        length(public_reference) <= 64 AND public_reference ~ '^[A-Z0-9][A-Z0-9-]*$'
    ),
    starts_at timestamptz NOT NULL CHECK (isfinite(starts_at)),
    ends_at timestamptz NOT NULL CHECK (isfinite(ends_at)),
    guests integer NOT NULL CHECK (guests > 0),
    source text NOT NULL CHECK (source IN ('web', 'chat')),
    status text NOT NULL CHECK (
        status IN ('pending', 'confirmed', 'arrived', 'completed', 'no-show', 'cancelled')
    ),
    status_reason text,
    policy_revision text NOT NULL CHECK (btrim(policy_revision) <> ''),
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at),
    UNIQUE (venue_id, public_reference),
    UNIQUE (venue_id, id)
);

CREATE TABLE reservation_contacts (
    reservation_id uuid PRIMARY KEY REFERENCES reservations (id),
    full_name text NOT NULL CHECK (btrim(full_name) <> ''),
    phone_normalized text NOT NULL CHECK (phone_normalized ~ '^\+[1-9][0-9]{1,14}$'),
    note text
);

CREATE TABLE guest_reservation_grants (
    guest_session_id uuid NOT NULL REFERENCES guest_sessions (id) ON DELETE CASCADE,
    reservation_id uuid NOT NULL REFERENCES reservations (id),
    granted_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    PRIMARY KEY (guest_session_id, reservation_id)
);

CREATE TABLE table_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    reservation_id uuid NOT NULL,
    table_id uuid NOT NULL,
    occupies_from timestamptz NOT NULL CHECK (isfinite(occupies_from)),
    occupies_until timestamptz NOT NULL CHECK (isfinite(occupies_until)),
    occupancy tstzrange GENERATED ALWAYS AS (
        tstzrange(occupies_from, occupies_until, '[)')
    ) STORED,
    state text NOT NULL CHECK (state IN ('held', 'committed', 'released')),
    hold_expires_at timestamptz CHECK (isfinite(hold_expires_at)),
    created_at timestamptz NOT NULL DEFAULT now(),
    released_at timestamptz,
    FOREIGN KEY (venue_id, reservation_id) REFERENCES reservations (venue_id, id),
    FOREIGN KEY (venue_id, table_id) REFERENCES dining_tables (venue_id, id),
    CHECK (occupies_from < occupies_until),
    CHECK (state <> 'held' OR hold_expires_at IS NOT NULL),
    CHECK ((state = 'released') = (released_at IS NOT NULL)),
    CONSTRAINT table_allocations_no_overlap
        EXCLUDE USING gist (table_id WITH =, occupancy WITH &&)
        WHERE (state IN ('held', 'committed'))
);

CREATE TABLE preorder_lines (
    venue_id uuid NOT NULL,
    reservation_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    dish_name_snapshot text NOT NULL CHECK (btrim(dish_name_snapshot) <> ''),
    unit_price_vnd bigint NOT NULL CHECK (unit_price_vnd BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (reservation_id, menu_item_id),
    FOREIGN KEY (venue_id, reservation_id) REFERENCES reservations (venue_id, id),
    FOREIGN KEY (venue_id, menu_item_id) REFERENCES menu_items (venue_id, id)
);

CREATE TABLE deposit_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    reservation_id uuid NOT NULL,
    reference text NOT NULL CHECK (btrim(reference) <> ''),
    bank_code text NOT NULL CHECK (btrim(bank_code) <> ''),
    account_number text NOT NULL CHECK (btrim(account_number) <> ''),
    account_name text NOT NULL CHECK (btrim(account_name) <> ''),
    amount_due_vnd bigint NOT NULL CHECK (amount_due_vnd BETWEEN 1 AND 9007199254740991),
    status text NOT NULL CHECK (status IN ('pending', 'review', 'verified', 'exception', 'expired')),
    status_reason text,
    is_current boolean NOT NULL,
    policy_revision text NOT NULL CHECK (btrim(policy_revision) <> ''),
    expires_at timestamptz,
    reported_at timestamptz,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (venue_id, reservation_id) REFERENCES reservations (venue_id, id),
    CHECK (expires_at IS NULL OR (isfinite(expires_at) AND expires_at > created_at)),
    UNIQUE (venue_id, reference),
    UNIQUE (venue_id, id)
);

CREATE TABLE payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    source_namespace text NOT NULL CHECK (btrim(source_namespace) <> ''),
    external_transaction_id text NOT NULL CHECK (btrim(external_transaction_id) <> ''),
    amount_received_vnd bigint NOT NULL CHECK (
        amount_received_vnd BETWEEN 1 AND 9007199254740991
    ),
    occurred_at timestamptz NOT NULL CHECK (isfinite(occurred_at)),
    transfer_content text,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (venue_id, source_namespace, external_transaction_id),
    UNIQUE (venue_id, id)
);

CREATE TABLE deposit_reconciliations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    deposit_request_id uuid NOT NULL,
    payment_transaction_id uuid,
    actor_staff_user_id uuid REFERENCES staff_users (id),
    source text NOT NULL CHECK (source IN ('staff', 'provider')),
    decision text NOT NULL CHECK (decision IN ('matched', 'exception')),
    reason_code text,
    note text,
    observation jsonb CHECK (
        observation IS NULL OR (decision = 'exception' AND jsonb_typeof(observation) = 'object')
    ),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (venue_id, deposit_request_id) REFERENCES deposit_requests (venue_id, id),
    FOREIGN KEY (venue_id, payment_transaction_id) REFERENCES payment_transactions (venue_id, id),
    CHECK ((source = 'staff') = (actor_staff_user_id IS NOT NULL)),
    CHECK (decision <> 'matched' OR payment_transaction_id IS NOT NULL),
    CHECK (decision <> 'exception' OR nullif(btrim(reason_code), '') IS NOT NULL)
);

CREATE TABLE reservation_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    reservation_id uuid NOT NULL,
    actor_staff_user_id uuid REFERENCES staff_users (id),
    source text NOT NULL CHECK (source IN ('web', 'chat', 'staff', 'provider', 'system')),
    event_type text NOT NULL CHECK (btrim(event_type) <> ''),
    reason_code text,
    note text,
    changes jsonb CHECK (changes IS NULL OR jsonb_typeof(changes) = 'object'),
    occurred_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (venue_id, reservation_id) REFERENCES reservations (venue_id, id),
    CHECK ((source = 'staff') = (actor_staff_user_id IS NOT NULL))
);

CREATE TABLE operation_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues (id),
    guest_session_id uuid REFERENCES guest_sessions (id) ON DELETE CASCADE,
    staff_user_id uuid REFERENCES staff_users (id),
    operation text NOT NULL CHECK (btrim(operation) <> ''),
    request_key text NOT NULL CHECK (length(request_key) BETWEEN 16 AND 128),
    request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
    outcome_status smallint NOT NULL CHECK (outcome_status IN (200, 201)),
    outcome_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    CHECK (num_nonnulls(guest_session_id, staff_user_id) = 1),
    CHECK (expires_at > created_at),
    UNIQUE NULLS NOT DISTINCT (venue_id, guest_session_id, staff_user_id, operation, request_key)
);

CREATE INDEX menu_items_public_order
    ON menu_items (venue_id, display_order, public_key) WHERE published;
CREATE INDEX dining_tables_active_area
    ON dining_tables (venue_id, area_id, code) WHERE active;
CREATE INDEX staff_sessions_expiry ON staff_sessions (expires_at);
CREATE INDEX guest_sessions_expiry ON guest_sessions (expires_at);
CREATE INDEX reservations_ops_time ON reservations (venue_id, starts_at, id);
CREATE INDEX reservations_ops_status_time ON reservations (venue_id, status, starts_at, id);
CREATE INDEX table_allocations_reservation ON table_allocations (reservation_id);
CREATE INDEX table_allocations_held_expiry
    ON table_allocations (venue_id, hold_expires_at) WHERE state = 'held';
CREATE UNIQUE INDEX deposit_requests_one_current
    ON deposit_requests (reservation_id) WHERE is_current;
CREATE INDEX deposit_requests_history ON deposit_requests (reservation_id, created_at DESC);
CREATE INDEX deposit_requests_ops_queue
    ON deposit_requests (venue_id, status, reservation_id) WHERE is_current;
CREATE INDEX payment_transactions_venue_time ON payment_transactions (venue_id, occurred_at, id);
CREATE UNIQUE INDEX deposit_reconciliations_one_match_per_transaction
    ON deposit_reconciliations (payment_transaction_id) WHERE decision = 'matched';
CREATE INDEX deposit_reconciliations_history
    ON deposit_reconciliations (deposit_request_id, created_at DESC, id DESC);
CREATE INDEX reservation_events_history ON reservation_events (reservation_id, occurred_at DESC, id DESC);
CREATE INDEX operation_keys_expiry ON operation_keys (expires_at);

COMMIT;
