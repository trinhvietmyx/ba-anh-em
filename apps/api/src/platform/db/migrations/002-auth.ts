import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<object>): Promise<void> {
  await sql`
    CREATE TABLE ba_anh_em.staff_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      oidc_issuer text NOT NULL CHECK (btrim(oidc_issuer) <> ''),
      oidc_subject text NOT NULL CHECK (btrim(oidc_subject) <> ''),
      display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 120 AND char_length(display_name) <= 120),
      display_role text NOT NULL DEFAULT 'employee' CHECK (display_role IN ('employee', 'admin')),
      active boolean NOT NULL DEFAULT true,
      UNIQUE (oidc_issuer, oidc_subject)
    );

    CREATE TABLE ba_anh_em.staff_venue_grants (
      staff_user_id uuid NOT NULL REFERENCES ba_anh_em.staff_users (id),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      permission text NOT NULL CHECK (permission IN (
        'menu.read', 'menu.write', 'reservations.read', 'reservations.read_contact',
        'reservations.read_audit', 'reservations.write_events', 'floorplan.read',
        'floorplan.allocate', 'kitchen.read', 'deposits.read', 'deposits.reconcile', 'reports.read'
      )),
      PRIMARY KEY (staff_user_id, venue_id, permission)
    );

    CREATE TABLE ba_anh_em.staff_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_user_id uuid NOT NULL REFERENCES ba_anh_em.staff_users (id),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
      permissions_at_login text[] NOT NULL CHECK (cardinality(permissions_at_login) > 0),
      created_at timestamptz NOT NULL DEFAULT now(),
      idle_expires_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      CHECK (created_at < idle_expires_at AND idle_expires_at <= expires_at)
    );

    CREATE TABLE ba_anh_em.guest_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      CHECK (created_at < expires_at)
    );

    CREATE TABLE ba_anh_em.staff_login_attempts (
      token_digest bytea PRIMARY KEY CHECK (octet_length(token_digest) = 32),
      state_digest bytea NOT NULL CHECK (octet_length(state_digest) = 32),
      nonce text NOT NULL,
      code_verifier text NOT NULL,
      return_to text NOT NULL CHECK (char_length(return_to) BETWEEN 1 AND 512),
      expires_at timestamptz NOT NULL
    );

    CREATE INDEX staff_sessions_expiry ON ba_anh_em.staff_sessions (expires_at);
    CREATE INDEX guest_sessions_expiry ON ba_anh_em.guest_sessions (expires_at);
    CREATE INDEX staff_login_attempts_expiry ON ba_anh_em.staff_login_attempts (expires_at);
  `.execute(db);
}
