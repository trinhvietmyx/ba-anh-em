import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<object>): Promise<void> {
  await sql`
    CREATE FUNCTION ba_anh_em.lock_booking_venue(venue_key uuid) RETURNS boolean
      LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
      AS $lock$
        SELECT true FROM ba_anh_em.venues WHERE id = venue_key FOR NO KEY UPDATE
      $lock$;
    REVOKE ALL ON FUNCTION ba_anh_em.lock_booking_venue(uuid) FROM PUBLIC;

    CREATE TABLE ba_anh_em.reservations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      public_reference text NOT NULL CHECK (length(public_reference) <= 64 AND public_reference ~ '^[A-Z0-9][A-Z0-9-]*$'),
      starts_at timestamptz NOT NULL CHECK (isfinite(starts_at)),
      ends_at timestamptz NOT NULL CHECK (isfinite(ends_at) AND ends_at > starts_at),
      guests integer NOT NULL CHECK (guests > 0),
      source text NOT NULL CHECK (source IN ('web', 'chat')),
      status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'arrived', 'completed', 'no-show', 'cancelled')),
      status_reason text,
      policy_revision text NOT NULL CHECK (btrim(policy_revision) <> ''),
      version integer NOT NULL DEFAULT 1 CHECK (version > 0),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (venue_id, public_reference),
      UNIQUE (venue_id, id)
    );

    CREATE TABLE ba_anh_em.reservation_contacts (
      reservation_id uuid PRIMARY KEY REFERENCES ba_anh_em.reservations (id),
      full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 80),
      phone_normalized text NOT NULL CHECK (phone_normalized ~ '^\\+[1-9][0-9]{1,14}$'),
      note text CHECK (char_length(note) <= 200)
    );

    CREATE TABLE ba_anh_em.guest_reservation_grants (
      guest_session_id uuid NOT NULL REFERENCES ba_anh_em.guest_sessions (id) ON DELETE CASCADE,
      reservation_id uuid NOT NULL REFERENCES ba_anh_em.reservations (id),
      granted_at timestamptz NOT NULL DEFAULT now(),
      revoked_at timestamptz,
      PRIMARY KEY (guest_session_id, reservation_id)
    );

    CREATE TABLE ba_anh_em.table_allocations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL,
      reservation_id uuid NOT NULL,
      table_id uuid NOT NULL,
      occupies_from timestamptz NOT NULL CHECK (isfinite(occupies_from)),
      occupies_until timestamptz NOT NULL CHECK (isfinite(occupies_until) AND occupies_until > occupies_from),
      occupancy tstzrange GENERATED ALWAYS AS (tstzrange(occupies_from, occupies_until, '[)')) STORED,
      state text NOT NULL CHECK (state IN ('held', 'committed', 'released')),
      hold_expires_at timestamptz CHECK (isfinite(hold_expires_at)),
      created_at timestamptz NOT NULL DEFAULT now(),
      released_at timestamptz,
      FOREIGN KEY (venue_id, reservation_id) REFERENCES ba_anh_em.reservations (venue_id, id),
      FOREIGN KEY (venue_id, table_id) REFERENCES ba_anh_em.dining_tables (venue_id, id),
      CHECK (state <> 'held' OR hold_expires_at IS NOT NULL),
      CHECK ((state = 'released') = (released_at IS NOT NULL)),
      CONSTRAINT table_allocations_no_overlap EXCLUDE USING gist (table_id WITH =, occupancy WITH &&)
        WHERE (state IN ('held', 'committed'))
    );

    CREATE TABLE ba_anh_em.reservation_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL,
      reservation_id uuid NOT NULL,
      actor_staff_user_id uuid REFERENCES ba_anh_em.staff_users (id),
      source text NOT NULL CHECK (source IN ('web', 'chat', 'staff', 'provider', 'system')),
      event_type text NOT NULL CHECK (btrim(event_type) <> ''),
      reason_code text,
      note text,
      changes jsonb CHECK (changes IS NULL OR jsonb_typeof(changes) = 'object'),
      occurred_at timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY (venue_id, reservation_id) REFERENCES ba_anh_em.reservations (venue_id, id),
      CHECK ((source = 'staff') = (actor_staff_user_id IS NOT NULL))
    );

    CREATE TABLE ba_anh_em.operation_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      guest_session_id uuid REFERENCES ba_anh_em.guest_sessions (id) ON DELETE CASCADE,
      staff_user_id uuid REFERENCES ba_anh_em.staff_users (id),
      operation text NOT NULL CHECK (btrim(operation) <> ''),
      request_key text NOT NULL CHECK (length(request_key) BETWEEN 16 AND 128),
      request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
      outcome_status smallint NOT NULL CHECK (outcome_status IN (200, 201)),
      outcome_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL CHECK (expires_at > created_at),
      CHECK (num_nonnulls(guest_session_id, staff_user_id) = 1),
      UNIQUE NULLS NOT DISTINCT (venue_id, guest_session_id, staff_user_id, operation, request_key)
    );

    CREATE INDEX reservations_ops_time ON ba_anh_em.reservations (venue_id, starts_at, id);
    CREATE INDEX table_allocations_reservation ON ba_anh_em.table_allocations (reservation_id);
    CREATE INDEX table_allocations_held_expiry ON ba_anh_em.table_allocations (venue_id, hold_expires_at) WHERE state = 'held';
    CREATE INDEX reservation_events_history ON ba_anh_em.reservation_events (reservation_id, occurred_at DESC, id DESC);
    CREATE INDEX operation_keys_expiry ON ba_anh_em.operation_keys (expires_at);
  `.execute(db);
}
