import { sql, type Kysely } from 'kysely';
import { validateFoundationImport } from './foundation-import';

const fixtureServiceRuleId = 'ae43f896-eb97-45e1-9853-839c372e9772';

const fixture = {
  source: 'Fixture kiểm thử T06',
  venue: {
    code: 'BAE-TEST-FIXTURE',
    name: 'Nhà hàng kiểm thử',
    timeZone: 'Asia/Ho_Chi_Minh',
  },
  areas: [
    { code: 'A', name: 'Sảnh mẫu', displayOrder: 0 },
    { code: 'B', name: 'Khu ngoài trời mẫu', displayOrder: 1 },
  ],
  tables: [
    { code: 'A01', areaCode: 'A', seats: 2 },
    { code: 'A02', areaCode: 'A', seats: 4 },
    { code: 'B01', areaCode: 'B', seats: 6 },
  ],
};

export async function seedFoundationTest(db: Kysely<object>): Promise<void> {
  const { venue, areas, tables } = validateFoundationImport(fixture);
  await db.transaction().execute(async (transaction) => {
    await sql`
      SELECT pg_advisory_xact_lock(hashtext(${'ba_anh_em:fixture:foundation'}))
    `.execute(transaction);

    await sql`
      INSERT INTO ba_anh_em.venues (code, name, time_zone)
      VALUES (${venue.code}, ${venue.name}, ${venue.timeZone})
      ON CONFLICT (code) DO NOTHING
    `.execute(transaction);
    const result = await sql<{ id: string }>`
      SELECT id FROM ba_anh_em.venues WHERE code = ${venue.code}
    `.execute(transaction);
    const venueId = result.rows[0]?.id;
    if (!venueId) throw new Error('Không tìm thấy nhà hàng fixture.');

    for (const area of areas) {
      await sql`
        INSERT INTO ba_anh_em.dining_areas (venue_id, code, name, display_order)
        VALUES (${venueId}, ${area.code}, ${area.name}, ${area.displayOrder})
        ON CONFLICT (venue_id, code) DO NOTHING
      `.execute(transaction);
    }
    for (const table of tables) {
      await sql`
        INSERT INTO ba_anh_em.dining_tables (venue_id, area_id, code, seats)
        SELECT venue_id, id, ${table.code}, ${table.seats}
        FROM ba_anh_em.dining_areas
        WHERE venue_id = ${venueId} AND code = ${table.areaCode}
        ON CONFLICT (venue_id, code) DO NOTHING
      `.execute(transaction);
    }

    await sql`
      INSERT INTO ba_anh_em.service_rules
        (id, venue_id, iso_weekday, effective_dates, opens_at, closes_at, ends_next_day)
      VALUES (${fixtureServiceRuleId}, ${venueId}, 1,
              daterange(DATE '2040-01-01', NULL, '[)'), '11:00', '22:00', false)
      ON CONFLICT DO NOTHING
    `.execute(transaction);

    await sql`
      INSERT INTO ba_anh_em.service_day_overrides (venue_id, service_date, is_closed)
      VALUES (${venueId}, DATE '2040-01-02', true), (${venueId}, DATE '2040-01-03', false)
      ON CONFLICT (venue_id, service_date) DO NOTHING
    `.execute(transaction);

    await sql`
      INSERT INTO ba_anh_em.service_override_windows
        (venue_id, service_date, opens_at, closes_at, ends_next_day)
      SELECT day_override.venue_id, day_override.service_date, TIME '12:00', TIME '21:00', false
      FROM ba_anh_em.service_day_overrides AS day_override
      WHERE day_override.venue_id = ${venueId}
        AND day_override.service_date = DATE '2040-01-03'
        AND NOT day_override.is_closed
        AND NOT EXISTS (
          SELECT 1 FROM ba_anh_em.service_override_windows AS existing_window
          WHERE existing_window.venue_id = day_override.venue_id
            AND existing_window.service_date = day_override.service_date
        )
      ON CONFLICT (venue_id, service_date, opens_at) DO NOTHING
    `.execute(transaction);
  });
}
