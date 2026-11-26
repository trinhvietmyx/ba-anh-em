import { createHash, randomBytes } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { sql, type Kysely, type RawBuilder } from 'kysely';
import { ApiException } from '../../platform/http/api-error.filter';
import { requireRequestKey } from '../../platform/http/idempotency-key';
import { GuestSessionService } from '../auth/guest-session.service';
import {
  AvailabilityService,
  BOOKING_TEST_TIME_ZONE,
  OCCUPANCY_MINUTES,
} from './availability.service';
import { bookingDate, type CreateReservationDto } from './booking.dto';

const OPERATION = 'createReservation';
const HOLD_MINUTES = 15;
export const RESERVATION_CODE_PATTERN = '^[A-Z0-9][A-Z0-9-]{0,63}$';
const codePattern = new RegExp(RESERVATION_CODE_PATTERN);

const currentAllocation = (asOf: RawBuilder<unknown>) => sql`
  (state = 'committed' OR (state = 'held' AND hold_expires_at > ${asOf}))
`;

interface ReservationRow {
  public_reference: string;
  date: string;
  time: string;
  starts_at: Date;
  ends_at: Date;
  guests: number;
  source: 'web' | 'chat';
  status:
    'pending' | 'confirmed' | 'arrived' | 'completed' | 'no-show' | 'cancelled';
  status_reason: string | null;
  version: number;
}

function prepared(input: CreateReservationDto) {
  const name = input.contact.name.trim();
  const entered = input.contact.phone.replace(/[ ().-]/g, '');
  const phone = /^0\d{9}$/.test(entered) ? `+84${entered.slice(1)}` : entered;
  if ([...name].length < 2 || !/^\+[1-9][0-9]{6,14}$/.test(phone))
    throw new UnprocessableEntityException();
  return {
    date: bookingDate(input.date),
    time: input.time,
    guests: input.guests,
    name,
    phone,
    note: input.note?.trim() || null,
  };
}

function capacityConflict(): ApiException {
  return new ApiException(
    {
      code: 'CAPACITY_UNAVAILABLE',
      message: 'Khung giờ này vừa hết chỗ. Hãy chọn giờ khác.',
    },
    409,
  );
}

@Injectable()
export class BookingService {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly guest: GuestSessionService,
  ) {}

  async create(headers: IncomingHttpHeaders, input: CreateReservationDto) {
    const { db, venueId } = await this.availability.scope();
    const guestId = await this.guest.requireWriteSession(headers);
    const key = requireRequestKey(headers);
    const values = prepared(input);
    const digest = createHash('sha256').update(JSON.stringify(values)).digest();

    try {
      return await db.transaction().execute(async (transaction) => {
        const {
          rows: [locked],
        } = await sql<{ locked: boolean | null }>`
          SELECT ba_anh_em.lock_booking_venue(${venueId}) AS locked
        `.execute(transaction);
        if (!locked?.locked) throw new ServiceUnavailableException();
        const {
          rows: [clock],
        } = await sql<{
          as_of: Date;
        }>`SELECT clock_timestamp() AS as_of`.execute(transaction);
        if (!clock) throw new Error('Booking clock returned no row');
        const now = clock.as_of;
        const {
          rows: [session],
        } = await sql<{ expires_at: Date }>`
          SELECT expires_at FROM ba_anh_em.guest_sessions
          WHERE id = ${guestId} AND revoked_at IS NULL AND expires_at > ${now}
        `.execute(transaction);
        if (!session) throw new UnauthorizedException();

        const {
          rows: [existing],
        } = await sql<{ request_digest: Buffer; outcome_id: string }>`
          SELECT request_digest, outcome_id FROM ba_anh_em.operation_keys
          WHERE venue_id = ${venueId} AND guest_session_id = ${guestId} AND operation = ${OPERATION}
            AND request_key = ${key} AND expires_at > ${now}
        `.execute(transaction);
        if (existing) {
          const result = await this.read(
            transaction,
            venueId,
            guestId,
            sql`r.id = ${existing.outcome_id}`,
          );
          if (!existing.request_digest.equals(digest))
            throw new ConflictException();
          return result;
        }

        const slots = await this.availability.findSlots(
          transaction,
          venueId,
          values,
          now,
        );
        const slot = slots.find(({ time }) => time === values.time);
        if (
          !slot ||
          slot.reason === 'SLOT_CLOSED' ||
          slot.reason === 'BOOKING_WINDOW_CLOSED'
        ) {
          throw new ApiException(
            {
              code: slot?.reason ?? 'SLOT_CLOSED',
              message: 'Khung giờ này nằm ngoài thời gian nhận đặt.',
            },
            422,
          );
        }
        if (!slot.table_id) throw capacityConflict();

        await this.releaseExpired(transaction, venueId, now);
        const reference = `BAE-${randomBytes(10).toString('hex').toUpperCase()}`;
        const {
          rows: [reservation],
        } = await sql<{ id: string; ends_at: Date }>`
          INSERT INTO ba_anh_em.reservations (venue_id, public_reference, starts_at, ends_at, guests, source, status, policy_revision)
          VALUES (${venueId}, ${reference}, ${slot.starts_at}, ${slot.starts_at}::timestamptz + ${OCCUPANCY_MINUTES} * interval '1 minute', ${values.guests}, 'web', 'pending', 'local-test-v1')
          RETURNING id, ends_at
        `.execute(transaction);
        if (!reservation) throw new Error('Reservation insert returned no row');
        await sql`
          INSERT INTO ba_anh_em.reservation_contacts (reservation_id, full_name, phone_normalized, note)
          VALUES (${reservation.id}, ${values.name}, ${values.phone}, ${values.note})
        `.execute(transaction);
        await sql`
          INSERT INTO ba_anh_em.table_allocations (venue_id, reservation_id, table_id, occupies_from, occupies_until, state, hold_expires_at)
          VALUES (${venueId}, ${reservation.id}, ${slot.table_id}, ${slot.starts_at}, ${reservation.ends_at}, 'held',
            LEAST(${slot.starts_at}::timestamptz, ${now}::timestamptz + ${HOLD_MINUTES} * interval '1 minute'))
        `.execute(transaction);
        await sql`
          INSERT INTO ba_anh_em.guest_reservation_grants (guest_session_id, reservation_id)
          VALUES (${guestId}, ${reservation.id})
        `.execute(transaction);
        await sql`
          INSERT INTO ba_anh_em.reservation_events (venue_id, reservation_id, source, event_type)
          VALUES (${venueId}, ${reservation.id}, 'web', 'reservation_created')
        `.execute(transaction);
        await sql`
          INSERT INTO ba_anh_em.operation_keys (venue_id, guest_session_id, operation, request_key, request_digest, outcome_status, outcome_id, created_at, expires_at)
          VALUES (${venueId}, ${guestId}, ${OPERATION}, ${key}, ${digest}, 201, ${reservation.id}, ${now}, ${session.expires_at})
        `.execute(transaction);
        return this.read(
          transaction,
          venueId,
          guestId,
          sql`r.id = ${reservation.id}`,
        );
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23P01')
        throw capacityConflict();
      throw error;
    }
  }

  async get(headers: IncomingHttpHeaders, reference: string) {
    const { db, venueId } = await this.availability.scope();
    const guestId = await this.guest.requireReadSession(headers);
    if (!codePattern.test(reference)) throw new BadRequestException();
    return this.read(
      db,
      venueId,
      guestId,
      sql`r.public_reference = ${reference}`,
    );
  }

  async getAttempt(headers: IncomingHttpHeaders) {
    const { db, venueId } = await this.availability.scope();
    const guestId = await this.guest.requireReadSession(headers);
    const key = requireRequestKey(headers);
    try {
      return await this.read(
        db,
        venueId,
        guestId,
        sql`EXISTS (
      SELECT 1 FROM ba_anh_em.operation_keys k WHERE k.venue_id = r.venue_id AND k.outcome_id = r.id
        AND k.guest_session_id = ${guestId} AND k.operation = ${OPERATION} AND k.request_key = ${key}
        AND k.expires_at > statement_timestamp()
    )`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ApiException(
          {
            code: 'OUTCOME_NOT_AVAILABLE',
            message: 'Chưa tìm thấy kết quả cho lần gửi này.',
          },
          404,
        );
      }
      throw error;
    }
  }

  private async read(
    db: Kysely<object>,
    venueId: string,
    guestId: string,
    filter: RawBuilder<unknown>,
  ) {
    const clock = sql`statement_timestamp()`;
    const {
      rows: [row],
    } = await sql<ReservationRow>`
      SELECT r.public_reference, to_char(r.starts_at AT TIME ZONE ${BOOKING_TEST_TIME_ZONE}, 'YYYY-MM-DD') AS date,
        to_char(r.starts_at AT TIME ZONE ${BOOKING_TEST_TIME_ZONE}, 'HH24:MI') AS time,
        r.starts_at, r.ends_at, r.guests, r.source,
        CASE WHEN expired.hold_ended THEN 'cancelled' ELSE r.status END AS status,
        CASE WHEN expired.hold_ended THEN 'HOLD_EXPIRED' ELSE r.status_reason END AS status_reason,
        r.version + CASE WHEN expired.hold_ended THEN 1 ELSE 0 END AS version
      FROM ba_anh_em.reservations r
      JOIN ba_anh_em.guest_reservation_grants g ON g.reservation_id = r.id
      JOIN ba_anh_em.guest_sessions session ON session.id = g.guest_session_id
      CROSS JOIN LATERAL (
        SELECT r.status = 'pending'
          AND EXISTS (SELECT 1 FROM ba_anh_em.table_allocations WHERE reservation_id = r.id AND state = 'held' AND hold_expires_at <= ${clock})
          AND NOT EXISTS (SELECT 1 FROM ba_anh_em.table_allocations WHERE reservation_id = r.id AND ${currentAllocation(clock)}) AS hold_ended
      ) expired
      WHERE r.venue_id = ${venueId} AND session.id = ${guestId} AND session.revoked_at IS NULL
        AND session.expires_at > ${clock} AND g.revoked_at IS NULL AND ${filter}
    `.execute(db);
    if (!row) throw new NotFoundException();
    return {
      id: row.public_reference,
      date: row.date,
      time: row.time,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      guests: row.guests,
      source: row.source,
      status: row.status,
      statusReason: row.status_reason,
      version: row.version,
      tables: [],
      items: [],
      preorderTotal: 0,
      deposit: null,
      nextActions: [],
    };
  }

  private async releaseExpired(db: Kysely<object>, venueId: string, now: Date) {
    await sql`
      WITH released AS (
        UPDATE ba_anh_em.table_allocations SET state = 'released', released_at = ${now}
        WHERE venue_id = ${venueId} AND state = 'held' AND hold_expires_at <= ${now}
        RETURNING reservation_id
      ), cancelled AS (
        UPDATE ba_anh_em.reservations r SET status = 'cancelled', status_reason = 'HOLD_EXPIRED', version = version + 1, updated_at = ${now}
        WHERE r.venue_id = ${venueId} AND r.status = 'pending' AND r.id IN (SELECT reservation_id FROM released)
          AND NOT EXISTS (SELECT 1 FROM ba_anh_em.table_allocations WHERE reservation_id = r.id AND ${currentAllocation(sql`${now}`)})
        RETURNING r.id
      )
      INSERT INTO ba_anh_em.reservation_events (venue_id, reservation_id, source, event_type, reason_code, occurred_at)
      SELECT ${venueId}, cancelled.id, 'system', 'hold_expired', 'HOLD_EXPIRED', ${now} FROM cancelled
    `.execute(db);
  }
}
