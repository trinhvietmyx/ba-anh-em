import { sql, type Kysely } from 'kysely';

export async function seedBookingTest(db: Kysely<object>): Promise<void> {
  await sql`
    INSERT INTO ba_anh_em.service_rules (id, venue_id, iso_weekday, effective_dates, opens_at, closes_at, ends_next_day)
    SELECT ('5ad03409-f12a-4705-9bfb-00000000000' || weekday)::uuid,
      venue.id, weekday, daterange(DATE '2020-01-01', NULL, '[)'), TIME '11:00', TIME '22:00', false
    FROM ba_anh_em.venues AS venue CROSS JOIN generate_series(1, 7) AS weekday
    WHERE venue.code = 'BAE-TEST-FIXTURE'
    ON CONFLICT DO NOTHING
  `.execute(db);
}
