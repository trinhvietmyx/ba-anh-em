import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<object>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public`.execute(
    db,
  );

  await sql`
    CREATE TABLE ba_anh_em.venues (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
      name text NOT NULL CHECK (btrim(name) <> ''),
      time_zone text NOT NULL CHECK (btrim(time_zone) <> '')
    )
  `.execute(db);

  await sql`
    CREATE TABLE ba_anh_em.dining_areas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      code text NOT NULL CHECK (btrim(code) <> ''),
      name text NOT NULL CHECK (btrim(name) <> ''),
      display_order integer NOT NULL DEFAULT 0,
      UNIQUE (venue_id, code),
      UNIQUE (venue_id, id)
    )
  `.execute(db);

  await sql`
    CREATE TABLE ba_anh_em.dining_tables (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      area_id uuid NOT NULL,
      code text NOT NULL CHECK (btrim(code) <> ''),
      seats integer NOT NULL CHECK (seats > 0),
      active boolean NOT NULL DEFAULT true,
      FOREIGN KEY (venue_id, area_id) REFERENCES ba_anh_em.dining_areas (venue_id, id),
      UNIQUE (venue_id, code),
      UNIQUE (venue_id, id)
    )
  `.execute(db);

  await sql`
    CREATE TABLE ba_anh_em.service_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
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
    )
  `.execute(db);

  await sql`
    CREATE TABLE ba_anh_em.service_day_overrides (
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      service_date date NOT NULL CHECK (isfinite(service_date)),
      is_closed boolean NOT NULL,
      PRIMARY KEY (venue_id, service_date)
    )
  `.execute(db);

  await sql`
    CREATE TABLE ba_anh_em.service_override_windows (
      venue_id uuid NOT NULL,
      service_date date NOT NULL,
      opens_at time NOT NULL CHECK (opens_at < TIME '24:00'),
      closes_at time NOT NULL CHECK (closes_at < TIME '24:00'),
      ends_next_day boolean NOT NULL,
      PRIMARY KEY (venue_id, service_date, opens_at),
      FOREIGN KEY (venue_id, service_date)
        REFERENCES ba_anh_em.service_day_overrides (venue_id, service_date),
      CHECK (
        (NOT ends_next_day AND closes_at > opens_at)
        OR (ends_next_day AND closes_at < opens_at)
      )
    )
  `.execute(db);

  await sql`
    CREATE INDEX dining_tables_active_area
      ON ba_anh_em.dining_tables (venue_id, area_id, code) WHERE active
  `.execute(db);
}
