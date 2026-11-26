import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<object>): Promise<void> {
  await sql`
    CREATE TABLE ba_anh_em.menu_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      public_key text NOT NULL CHECK (
        char_length(public_key) <= 120 AND public_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      ),
      name text NOT NULL CHECK (btrim(name) <> '' AND char_length(name) <= 160),
      category text NOT NULL CHECK (btrim(category) <> '' AND char_length(category) <= 100),
      description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
      image_url text CHECK (char_length(image_url) <= 2048),
      price_vnd bigint NOT NULL CHECK (price_vnd BETWEEN 0 AND 9007199254740991),
      published boolean NOT NULL DEFAULT false,
      available boolean NOT NULL DEFAULT false,
      display_order integer NOT NULL DEFAULT 0,
      version integer NOT NULL DEFAULT 1 CHECK (version > 0),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (venue_id, public_key),
      UNIQUE (venue_id, id)
    );

    CREATE INDEX menu_items_public_order ON ba_anh_em.menu_items (venue_id, display_order, public_key) WHERE published;

    CREATE TABLE ba_anh_em.menu_write_keys (
      venue_id uuid NOT NULL REFERENCES ba_anh_em.venues (id),
      staff_user_id uuid NOT NULL REFERENCES ba_anh_em.staff_users (id),
      operation text NOT NULL CHECK (operation IN ('create', 'update')),
      request_key text NOT NULL CHECK (char_length(request_key) BETWEEN 16 AND 128),
      request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
      menu_item_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (venue_id, staff_user_id, operation, request_key),
      FOREIGN KEY (venue_id, menu_item_id) REFERENCES ba_anh_em.menu_items (venue_id, id)
    );
  `.execute(db);
}
