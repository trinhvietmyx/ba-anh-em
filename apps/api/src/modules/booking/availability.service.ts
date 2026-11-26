import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../platform/config/runtime-config';
import { DatabaseService } from '../../platform/db/database.service';
import { TEST_DATABASE_SUFFIX } from '../../platform/db/test-database';

export const BOOKING_TEST_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const SLOT_MINUTES = 30;
export const OCCUPANCY_MINUTES = 90;
const HORIZON_DAYS = 60;

type SlotReason =
  'CAPACITY_UNAVAILABLE' | 'SLOT_CLOSED' | 'BOOKING_WINDOW_CLOSED';

interface SlotRow {
  time: string;
  starts_at: Date;
  table_id: string | null;
  reason: SlotReason | null;
}

interface Criteria {
  date: string;
  guests: number;
  time?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    private readonly database: DatabaseService,
  ) {}

  async scope() {
    const db = this.database.connection;
    if (!this.config.bookingTestEnabled || !db)
      throw new ServiceUnavailableException();
    const {
      rows: [venue],
    } = await sql<{ id: string; database_name: string }>`
      SELECT id, current_database() AS database_name FROM ba_anh_em.venues
      WHERE code = 'BAE-TEST-FIXTURE' AND time_zone = ${BOOKING_TEST_TIME_ZONE}
    `.execute(db);
    if (!venue || !TEST_DATABASE_SUFFIX.test(venue.database_name))
      throw new ServiceUnavailableException();
    return { db, venueId: venue.id };
  }

  async list(criteria: Criteria) {
    const { db, venueId } = await this.scope();
    const rows = await this.findSlots(db, venueId, criteria);
    return {
      date: criteria.date,
      timeZone: BOOKING_TEST_TIME_ZONE,
      guests: criteria.guests,
      slots: rows.map((row) => ({
        time: row.time,
        startsAt: row.starts_at.toISOString(),
        available: row.reason === null,
        reason: row.reason,
      })),
    };
  }

  async findSlots(
    db: Kysely<object>,
    venueId: string,
    criteria: Criteria,
    asOf?: Date,
  ): Promise<SlotRow[]> {
    const { rows } = await sql<SlotRow>`
      WITH request AS (
        SELECT ${criteria.date}::date AS day, ${criteria.time ?? null}::time AS requested_time,
          COALESCE(${asOf ?? null}::timestamptz, statement_timestamp()) AS as_of
      ), service_days AS (
        SELECT day AS service_day FROM request
        UNION ALL SELECT day - 1 FROM request
      ), windows AS (
        SELECT days.service_day, rules.opens_at, rules.closes_at, rules.ends_next_day
        FROM service_days days JOIN ba_anh_em.service_rules rules
          ON rules.venue_id = ${venueId} AND rules.effective_dates @> days.service_day
          AND rules.iso_weekday = EXTRACT(ISODOW FROM days.service_day)
        WHERE NOT EXISTS (
          SELECT 1 FROM ba_anh_em.service_day_overrides overrides
          WHERE overrides.venue_id = ${venueId} AND overrides.service_date = days.service_day
        )
        UNION ALL
        SELECT days.service_day, windows.opens_at, windows.closes_at, windows.ends_next_day
        FROM service_days days JOIN ba_anh_em.service_day_overrides overrides
          ON overrides.venue_id = ${venueId} AND overrides.service_date = days.service_day AND NOT overrides.is_closed
        JOIN ba_anh_em.service_override_windows windows USING (venue_id, service_date)
      ), scheduled_slots AS (
        SELECT DISTINCT local_start
        FROM windows CROSS JOIN request
        CROSS JOIN LATERAL generate_series(
          service_day + opens_at,
          (service_day + CASE WHEN ends_next_day THEN 1 ELSE 0 END) + closes_at - ${OCCUPANCY_MINUTES} * interval '1 minute',
          ${SLOT_MINUTES} * interval '1 minute'
        ) AS slots(local_start)
        WHERE local_start::date = request.day AND NOT EXISTS (
          SELECT 1 FROM ba_anh_em.service_day_overrides overrides
          WHERE overrides.venue_id = ${venueId} AND overrides.service_date = request.day AND overrides.is_closed
        )
      ), candidates AS (
        SELECT local_start, true AS scheduled FROM scheduled_slots
        UNION ALL
        SELECT day + requested_time, false FROM request WHERE requested_time IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM scheduled_slots WHERE local_start = day + requested_time)
      ), slots AS (
        SELECT local_start, local_start AT TIME ZONE ${BOOKING_TEST_TIME_ZONE} AS starts_at, scheduled, as_of
        FROM candidates CROSS JOIN request
      )
      SELECT to_char(local_start, 'HH24:MI') AS time, starts_at, free.id AS table_id,
        CASE WHEN NOT scheduled THEN 'SLOT_CLOSED'
          WHEN starts_at <= as_of OR local_start::date > (as_of AT TIME ZONE ${BOOKING_TEST_TIME_ZONE})::date + ${HORIZON_DAYS}::integer THEN 'BOOKING_WINDOW_CLOSED'
          WHEN free.id IS NULL THEN 'CAPACITY_UNAVAILABLE'
          ELSE NULL END AS reason
      FROM slots LEFT JOIN LATERAL (
        SELECT tbl.id FROM ba_anh_em.dining_tables tbl
        WHERE slots.scheduled AND tbl.venue_id = ${venueId} AND tbl.active AND tbl.seats >= ${criteria.guests}
          AND NOT EXISTS (
            SELECT 1 FROM ba_anh_em.table_allocations alloc
            WHERE alloc.table_id = tbl.id AND alloc.state IN ('held', 'committed')
              AND (alloc.state = 'committed' OR alloc.hold_expires_at > slots.as_of)
              AND alloc.occupancy && tstzrange(slots.starts_at, slots.starts_at + ${OCCUPANCY_MINUTES} * interval '1 minute', '[)')
          )
        ORDER BY tbl.seats, tbl.code LIMIT 1
      ) free ON true
      ORDER BY local_start
    `.execute(db);
    return rows;
  }
}
