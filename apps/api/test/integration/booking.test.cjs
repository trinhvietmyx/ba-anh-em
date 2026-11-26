const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');
const Ajv = require('ajv/dist/2020').default;
const contract = require('@ba-anh-em/api-contract/openapi.json');
const { createApiApp } = require('../../dist/api-app.js');
const {
  readRuntimeConfig,
} = require('../../dist/platform/config/runtime-config.js');
const {
  withPostgres,
  command,
  temporaryDatabase,
} = require('./database-fixture.cjs');

const origin = 'http://127.0.0.1:5173';

function verifyContract(path, method, status, body) {
  const schema =
    contract.paths['/api/v1' + path][method].responses[status].content[
      'application/json'
    ].schema;
  const schemas = new Ajv({ strict: false });
  schemas.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
  schemas.addFormat(
    'date-time',
    (value) => new Date(value).toISOString() === value,
  );
  const validate = schemas.compile(schema);
  assert.ok(validate(body), JSON.stringify(validate.errors));
}

test('booking endpoints are unavailable until the local booking fixture is enabled', async () => {
  const app = await createApiApp(readRuntimeConfig({}), false);
  try {
    await app.listen(0, '127.0.0.1');
    const response = await fetch(
      `${await app.getUrl()}/api/v1/availability?date=2040-01-02&guests=4`,
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'DEPENDENCY_UNAVAILABLE');
  } finally {
    await app.close();
  }
});

test('booking fixture rejects production or an ordinary database', () => {
  const variables = {
    BOOKING_TEST_ENABLED: '1',
    DATABASE_URL: 'postgresql://127.0.0.1/bae_test',
  };
  assert.throws(
    () => readRuntimeConfig({ ...variables, NODE_ENV: 'production' }),
    /BOOKING_TEST_ENABLED/,
  );
  assert.throws(
    () =>
      readRuntimeConfig({
        ...variables,
        DATABASE_URL: 'postgresql://127.0.0.1/bae',
      }),
    /BOOKING_TEST_ENABLED/,
  );
  assert.throws(
    () =>
      readRuntimeConfig({
        ...variables,
        DATABASE_URL: 'postgresql://127.0.0.1/bae_test?host=fixture.invalid',
      }),
    /BOOKING_TEST_ENABLED/,
  );
});

test(
  'locks competing reservations, expires holds and recovers only the owning guest attempt',
  withPostgres,
  async (t) => {
    const { client, url } = await temporaryDatabase(t);
    for (const [name, env] of [
      ['migrate', { MIGRATION_DATABASE_URL: url }],
      ['seed-test', { BAE_TEST_SEED_DATABASE_URL: url }],
      ['seed-booking-test', { BAE_TEST_SEED_DATABASE_URL: url }],
    ]) {
      const result = command(name, env);
      assert.equal(result.status, 0, result.stderr);
    }
    const {
      rows: [dates],
    } = await client.query(`
    SELECT to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 2, 'YYYY-MM-DD') AS open_date,
           to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 3, 'YYYY-MM-DD') AS closed_date,
           to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 4, 'YYYY-MM-DD') AS overnight_date
  `);
    const date = dates.open_date;
    const {
      rows: [venue],
    } = await client.query(
      "SELECT id FROM ba_anh_em.venues WHERE code = 'BAE-TEST-FIXTURE'",
    );
    await client.query(
      `INSERT INTO ba_anh_em.service_day_overrides VALUES ($1, $2, true), ($1,$3,false)`,
      [venue.id, dates.closed_date, dates.overnight_date],
    );
    await client.query(
      "INSERT INTO ba_anh_em.service_override_windows VALUES ($1,$2,'22:00','02:00',true)",
      [venue.id, dates.overnight_date],
    );
    const config = readRuntimeConfig({
      NODE_ENV: 'test',
      BOOKING_TEST_ENABLED: '1',
      DATABASE_URL: url,
      APP_ORIGIN: origin,
      GUEST_SESSION_TTL_SECONDS: '3600',
    });
    const app = await createApiApp(config, false);
    const peerApp = await createApiApp(config, false);
    try {
      await app.listen(0, '127.0.0.1');
      await peerApp.listen(0, '127.0.0.1');
      const base = `${await app.getUrl()}/api/v1`;
      const peerBase = `${await peerApp.getUrl()}/api/v1`;
      async function request(path, init, target = base) {
        const response = await fetch(target + path, init);
        return {
          status: response.status,
          body: await response.json(),
          headers: response.headers,
        };
      }
      async function guest() {
        const response = await request('/guest/session', {
          method: 'POST',
          headers: { Origin: origin },
        });
        assert.equal(response.status, 200);
        return {
          Cookie: response.headers.getSetCookie()[0].split(';')[0],
          'X-CSRF-Token': response.body.csrfToken,
          Origin: origin,
        };
      }
      const a = await guest();
      const b = await guest();
      const availability = (query) =>
        request(`/availability?${new URLSearchParams(query)}`);
      const open = await availability({ date, guests: '6' });
      assert.equal(open.status, 200);
      verifyContract('/availability', 'get', 200, open.body);
      assert.equal(open.body.timeZone, 'Asia/Ho_Chi_Minh');
      assert.deepEqual(open.body.slots[0], {
        time: '11:00',
        startsAt: `${date}T04:00:00.000Z`,
        available: true,
        reason: null,
      });
      assert.equal(open.body.slots.at(-1).time, '20:30');
      assert.deepEqual(
        (await availability({ date: dates.closed_date, guests: '6' })).body
          .slots,
        [],
      );
      const closed = await availability({
        date: dates.closed_date,
        guests: '6',
        time: '18:00',
      });
      assert.equal(closed.body.slots[0].reason, 'SLOT_CLOSED');
      const overnight = await availability({
        date: dates.overnight_date,
        guests: '6',
      });
      assert.deepEqual(
        overnight.body.slots.map(({ time }) => time),
        ['22:00', '22:30', '23:00', '23:30'],
      );
      const following = new Date(Date.parse(dates.overnight_date) + 86_400_000)
        .toISOString()
        .slice(0, 10);
      const spillover = await availability({ date: following, guests: '6' });
      assert.deepEqual(
        spillover.body.slots.slice(0, 2).map(({ time }) => time),
        ['00:00', '00:30'],
      );
      assert.equal(
        (await availability({ date: '2040-02-30', guests: '6' })).status,
        422,
      );
      assert.equal(
        (
          await availability({ date, guests: '6', time: '12:15' })
        ).body.slots.find(({ time }) => time === '12:15').reason,
        'SLOT_CLOSED',
      );

      const firstKey = randomUUID();
      const same = {
        date,
        time: '11:00',
        guests: 6,
        contact: { name: 'Khách mẫu', phone: '0900000001' },
      };
      const create = (data, key, headers = a, target = base) =>
        request(
          '/reservations',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': key,
              ...headers,
            },
            body: JSON.stringify(data),
          },
          target,
        );
      assert.equal(
        (await create(same, firstKey, { ...a, 'X-CSRF-Token': 'bad' })).status,
        403,
      );
      assert.equal(
        (await create({ ...same, chatContext: 'fixture' }, firstKey)).status,
        422,
      );
      const concurrent = await Promise.all([
        create(same, firstKey),
        create(same, firstKey, a, peerBase),
      ]);
      assert.deepEqual(
        concurrent.map(({ status }) => status),
        [201, 201],
      );
      const booking = concurrent[0].body;
      verifyContract('/reservations', 'post', 201, booking);
      assert.deepEqual(concurrent[1].body, booking);
      assert.equal(booking.status, 'pending');
      assert.deepEqual(booking.nextActions, []);
      assert.equal(booking.deposit, null);
      assert.equal(booking.contact, undefined);
      const path = '/reservations/' + booking.id;
      const get = (path, headers, key) =>
        request(path, {
          headers: { ...headers, ...(key ? { 'Idempotency-Key': key } : {}) },
        });
      assert.deepEqual((await get(path, a)).body, booking);
      assert.equal((await get(path, b)).status, 404);
      assert.equal((await get(path, {})).status, 401);
      const otherAttempt = await get(
        '/guest/reservation-attempts',
        b,
        firstKey,
      );
      const unknownAttempt = await get(
        '/guest/reservation-attempts',
        a,
        randomUUID(),
      );
      for (const result of [otherAttempt, unknownAttempt]) {
        assert.equal(result.status, 404);
        assert.equal(result.body.code, 'OUTCOME_NOT_AVAILABLE');
      }
      assert.deepEqual(
        (await get('/guest/reservation-attempts', a, firstKey)).body,
        booking,
      );
      assert.equal(
        (await create({ ...same, guests: 5 }, firstKey)).status,
        409,
      );
      assert.equal(
        (await create({ ...same, time: '11:30' }, randomUUID(), b)).status,
        409,
      );
      assert.equal(
        (await create({ ...same, time: '12:30' }, randomUUID(), b)).status,
        201,
      );

      const next = { ...same, time: '14:00' };
      const results = await Promise.all([
        create(next, randomUUID()),
        create({ ...next, time: '14:30' }, randomUUID(), b, peerBase),
      ]);
      assert.deepEqual(results.map(({ status }) => status).sort(), [201, 409]);
      await client.query(
        "UPDATE ba_anh_em.table_allocations SET hold_expires_at = clock_timestamp() - interval '1 second' WHERE reservation_id = (SELECT id FROM ba_anh_em.reservations WHERE public_reference = $1)",
        [booking.id],
      );
      const expired = await get(path, a);
      assert.equal(expired.body.status, 'cancelled');
      assert.equal(expired.body.statusReason, 'HOLD_EXPIRED');
      assert.equal(
        (
          await availability({ date, time: '11:00', guests: '6' })
        ).body.slots.find(({ time }) => time === '11:00').available,
        true,
      );
      assert.equal((await create(same, randomUUID(), b)).status, 201);
      assert.deepEqual((await get(path, a)).body, expired.body);
      const {
        rows: [stored],
      } = await client.query(
        "SELECT (SELECT count(*)::int FROM ba_anh_em.reservations) AS reservations, (SELECT count(*)::int FROM ba_anh_em.operation_keys) AS keys, (SELECT count(*)::int FROM ba_anh_em.reservation_events WHERE event_type = 'hold_expired') AS expired",
      );
      assert.deepEqual(stored, { reservations: 4, keys: 4, expired: 1 });
      await client.query(
        'UPDATE ba_anh_em.guest_reservation_grants SET revoked_at = now() WHERE reservation_id = (SELECT id FROM ba_anh_em.reservations WHERE public_reference = $1)',
        [booking.id],
      );
      assert.equal((await get(path, a)).status, 404);
      assert.equal(
        (await get('/guest/reservation-attempts', a, firstKey)).status,
        404,
      );
      assert.equal((await create(same, firstKey)).status, 404);

      await client.query('BEGIN');
      let pending;
      let observedWait = false;
      try {
        await client.query(
          'SELECT id FROM ba_anh_em.venues WHERE id = $1 FOR UPDATE',
          [venue.id],
        );
        await client.query(
          'UPDATE ba_anh_em.dining_tables SET active = false WHERE venue_id = $1 AND seats >= 6',
          [venue.id],
        );
        pending = create({ ...same, time: '19:00' }, randomUUID(), b, peerBase);
        for (let attempt = 0; attempt < 30 && !observedWait; attempt += 1) {
          await client.query('SELECT pg_stat_clear_snapshot()');
          const { rowCount } = await client.query(`
            SELECT 1 FROM pg_stat_activity WHERE datname = current_database()
              AND pid <> pg_backend_pid() AND wait_event_type = 'Lock'
              AND (query LIKE '%lock_booking_venue%' OR query LIKE '%INSERT INTO ba_anh_em.reservations%')
          `);
          observedWait = rowCount > 0;
          if (!observedWait) await delay(20);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      assert.equal(
        observedWait,
        true,
        'reservation did not wait for the venue writer',
      );
      assert.equal((await pending).status, 409);
    } finally {
      await Promise.all([app.close(), peerApp.close()]);
    }
  },
);
