const assert = require('node:assert/strict');
const { createHash, randomBytes } = require('node:crypto');
const { test } = require('node:test');
const Ajv2020 = require('ajv/dist/2020').default;
const contract = require('@ba-anh-em/api-contract/openapi.json');
const { Client } = require('pg');
const {
  withPostgres,
  command,
  temporaryDatabase,
} = require('./database-fixture.cjs');
const { startOidc } = require('./oidc-fixture.cjs');
const { createApiApp } = require('../../dist/api-app.js');
const {
  readRuntimeConfig,
} = require('../../dist/platform/config/runtime-config.js');
const {
  GuestSessionService,
} = require('../../dist/modules/auth/guest-session.service.js');
const {
  StaffSessionService,
} = require('../../dist/modules/auth/staff-session.service.js');

const origin = 'http://localhost:5173';
const staffCookieName = '__Host-bae_staff';
const loginCookieName = '__Host-bae_login';
const guestCookieName = '__Host-bae_guest';

async function startApi(t, env, logger = false) {
  const app = await createApiApp(
    readRuntimeConfig({ NODE_ENV: 'test', ...env }),
    logger,
  );
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  return { app, base: (await app.getUrl()) + '/api/v1' };
}

test('session endpoints fail closed until their dependencies are configured', async (t) => {
  const { base } = await startApi(t, {});
  for (const [method, path] of [
    ['POST', '/guest/session'],
    ['GET', '/ops/auth/login'],
    ['GET', '/ops/auth/callback'],
    ['GET', '/ops/session'],
    ['DELETE', '/ops/session'],
  ]) {
    const response = await fetch(base + path, { method, redirect: 'manual' });
    assert.equal(response.status, 503, `${method} ${path}`);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).code, 'DEPENDENCY_UNAVAILABLE');
  }
});

test('auth requires an explicit origin, venue and session policy', () => {
  assert.throws(
    () => readRuntimeConfig({ APP_ORIGIN: 'https://app.example/ops' }),
    /APP_ORIGIN/,
  );
  assert.throws(
    () =>
      readRuntimeConfig({
        NODE_ENV: 'production',
        APP_ORIGIN: 'http://localhost:5173',
      }),
    /APP_ORIGIN/,
  );
  assert.throws(
    () => readRuntimeConfig({ GUEST_SESSION_TTL_SECONDS: '3600' }),
    /APP_ORIGIN/,
  );
  assert.throws(
    () =>
      readRuntimeConfig({
        APP_ORIGIN: origin,
        OIDC_ISSUER: 'https://login.example',
      }),
    /OIDC_CLIENT_ID/,
  );
  assert.throws(
    () =>
      readRuntimeConfig({
        APP_ORIGIN: 'https://app.example',
        OIDC_ISSUER: 'https://login.example',
        OIDC_CLIENT_ID: 'fixture-app',
        OIDC_CLIENT_SECRET: 'fixture-secret',
        STAFF_SESSION_TTL_SECONDS: '3600',
        STAFF_SESSION_IDLE_SECONDS: '900',
      }),
    /STAFF_VENUE_CODE/,
  );
});

test('limits repeated session requests and returns Retry-After', async (t) => {
  const { base } = await startApi(t, {
    APP_ORIGIN: origin,
    GUEST_SESSION_TTL_SECONDS: '3600',
    AUTH_RATE_LIMIT_PER_MINUTE: '2',
  });
  for (const expected of [503, 503, 429]) {
    const response = await fetch(base + '/guest/session', {
      method: 'POST',
      headers: {
        Origin: origin,
        'X-Forwarded-For': `192.0.2.${randomBytes(1)[0]}`,
      },
    });
    assert.equal(response.status, expected);
    if (expected === 429) {
      assert.match(response.headers.get('retry-after'), /^\d+$/);
      assert.equal((await response.json()).code, 'RATE_LIMITED');
    }
  }
});

function takeCookie(response, name) {
  const setCookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith(name + '='));
  assert.match(
    setCookie,
    /; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=/,
  );
  return setCookie.split(';')[0];
}

function digest(cookie) {
  return createHash('sha256').update(cookie.split('=')[1]).digest();
}

function validateSession(path, method, body) {
  const validator = new Ajv2020({ strict: false });
  validator.addFormat(
    'date-time',
    (value) => new Date(value).toISOString() === value,
  );
  const validate = validator.compile(
    contract.paths['/api/v1' + path][method].responses['200'].content[
      'application/json'
    ].schema,
  );
  assert.ok(validate(body), JSON.stringify(validate.errors));
}

test(
  'validates and revokes guest and staff sessions on PostgreSQL',
  withPostgres,
  async (t) => {
    const role = 'bae_auth_' + randomBytes(6).toString('hex');
    const password = randomBytes(24).toString('hex');
    let roleCreated = false;
    t.after(async () => {
      if (!roleCreated) return;
      const admin = new Client({
        connectionString: process.env.BAE_TEST_POSTGRES_ADMIN_URL,
      });
      await admin.connect();
      try {
        await admin.query(`DROP ROLE ${role}`);
      } finally {
        await admin.end();
      }
    });

    await t.test(
      'exercises the API using a separate runtime role and an OIDC issuer on loopback',
      async (fixture) => {
        const { client, url } = await temporaryDatabase(fixture);
        const migration = command('migrate', { MIGRATION_DATABASE_URL: url });
        assert.equal(migration.status, 0, migration.stderr);
        await client.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}'`);
        roleCreated = true;
        await client.query(`
      GRANT USAGE ON SCHEMA ba_anh_em TO ${role};
      GRANT SELECT ON ba_anh_em.venues, ba_anh_em.staff_users, ba_anh_em.staff_venue_grants, ba_anh_em.kysely_migration TO ${role};
      GRANT SELECT, INSERT ON ba_anh_em.guest_sessions, ba_anh_em.staff_sessions TO ${role};
      GRANT UPDATE (idle_expires_at, revoked_at) ON ba_anh_em.staff_sessions TO ${role};
      GRANT SELECT, INSERT, DELETE ON ba_anh_em.staff_login_attempts TO ${role};
    `);
        const runtimeUrl = new URL(url);
        runtimeUrl.username = role;
        runtimeUrl.password = password;
        const clientId = 'fixture-app';
        const clientSecret = randomBytes(24).toString('hex');
        const oidc = await startOidc(fixture, clientId, clientSecret);
        const {
          rows: [venue, otherVenue],
        } = await client.query(`
      INSERT INTO ba_anh_em.venues (code, name, time_zone)
      VALUES ('current', 'Current venue', 'Asia/Ho_Chi_Minh'), ('other', 'Other venue', 'Asia/Ho_Chi_Minh') RETURNING id
    `);
        const {
          rows: [staff, otherStaff],
        } = await client.query(
          `
      INSERT INTO ba_anh_em.staff_users (oidc_issuer, oidc_subject, display_name, display_role)
      VALUES ($1, 'fixture-staff', 'Nhân sự kiểm thử', 'admin'), ($1, 'fixture-other', 'Nhân sự cơ sở khác', 'employee') RETURNING id
    `,
          [oidc.issuer],
        );
        await client.query(
          `
      INSERT INTO ba_anh_em.staff_venue_grants VALUES ($1,$2,'menu.read'), ($1,$3,'menu.write'), ($4,$3,'menu.read')
    `,
          [staff.id, venue.id, otherVenue.id, otherStaff.id],
        );

        const logs = [];
        const events = {
          log: (value) => logs.push(value),
          warn: (value) => logs.push(value),
          error: (value) => logs.push(value),
        };
        const secrets = [clientSecret, 'fixture-access-token'];
        await fixture.test('runs both session flows', async (suite) => {
          const { app, base } = await startApi(
            suite,
            {
              APP_ORIGIN: origin,
              GUEST_SESSION_TTL_SECONDS: '3600',
              DATABASE_URL: runtimeUrl.href,
              OIDC_ISSUER: oidc.issuer,
              OIDC_CLIENT_ID: clientId,
              OIDC_CLIENT_SECRET: clientSecret,
              STAFF_VENUE_CODE: 'current',
              STAFF_SESSION_TTL_SECONDS: '3600',
              STAFF_SESSION_IDLE_SECONDS: '900',
            },
            events,
          );
          const request = (path, init) =>
            fetch(base + path, { redirect: 'manual', ...init });
          const guest = (headers) =>
            request('/guest/session', { method: 'POST', headers });
          let guestCookie;

          await suite.test(
            'reuses a valid guest session and rejects missing Origin, CSRF and expired sessions',
            async () => {
              assert.equal((await guest({})).status, 403);
              assert.equal(
                (await guest({ Origin: 'https://cross-origin.example' }))
                  .status,
                403,
              );
              const created = await guest({ Origin: origin });
              assert.equal(created.status, 200);
              guestCookie = takeCookie(created, guestCookieName);
              const body = await created.json();
              validateSession('/guest/session', 'post', body);
              secrets.push(guestCookie, body.csrfToken);
              const {
                rows: [stored],
              } = await client.query(
                'SELECT id, token_digest FROM ba_anh_em.guest_sessions',
              );
              assert.deepEqual(stored.token_digest, digest(guestCookie));
              const reused = await guest({
                Origin: origin,
                Cookie: guestCookie,
              });
              assert.equal(reused.status, 200);
              assert.equal(reused.headers.get('set-cookie'), null);
              assert.deepEqual(await reused.json(), body);

              const writes = app.get(GuestSessionService);
              const headers = {
                origin,
                cookie: guestCookie,
                'x-csrf-token': body.csrfToken,
              };
              assert.equal(
                await writes.requireWriteSession(headers),
                stored.id,
              );
              await assert.rejects(
                writes.requireWriteSession({
                  ...headers,
                  'x-csrf-token': undefined,
                }),
                { status: 403 },
              );
              await assert.rejects(
                writes.requireWriteSession({ ...headers, origin: null }),
                { status: 403 },
              );
              await client.query(
                "UPDATE ba_anh_em.guest_sessions SET created_at = now() - interval '1 hour', expires_at = now() - interval '1 second' WHERE id = $1",
                [stored.id],
              );
              await assert.rejects(writes.requireWriteSession(headers), {
                status: 401,
              });
              const rotated = await guest({
                Origin: origin,
                Cookie: guestCookie,
              });
              assert.equal(rotated.status, 200);
              guestCookie = takeCookie(rotated, guestCookieName);
              const rotatedBody = await rotated.json();
              await client.query(
                'UPDATE ba_anh_em.guest_sessions SET revoked_at = now() WHERE token_digest = $1',
                [digest(guestCookie)],
              );
              await assert.rejects(
                writes.requireWriteSession({
                  origin,
                  cookie: guestCookie,
                  'x-csrf-token': rotatedBody.csrfToken,
                }),
                { status: 401 },
              );
              assert.equal(
                (
                  await request('/ops/session', {
                    headers: { Cookie: guestCookie },
                  })
                ).status,
                401,
              );
            },
          );

          async function begin(options, returnTo = '/van-hanh/thuc-don') {
            const response = await request(
              '/ops/auth/login?returnTo=' + encodeURIComponent(returnTo),
            );
            assert.equal(response.status, 302);
            const loginCookie = takeCookie(response, loginCookieName);
            const { code, callback } = oidc.issue(
              response.headers.get('location'),
              options,
            );
            assert.equal(callback.origin, origin);
            secrets.push(code, loginCookie, callback.searchParams.get('state'));
            return { loginCookie, callback };
          }

          const finish = (attempt, extraCookie) =>
            request('/ops/auth/callback' + attempt.callback.search, {
              headers: {
                Cookie: [attempt.loginCookie, extraCookie]
                  .filter(Boolean)
                  .join('; '),
              },
            });

          await suite.test(
            'rejects disallowed return paths, unbound callbacks, invalid ID tokens and users of another venue',
            async () => {
              for (const path of [
                'https://outside.example',
                '//outside.example',
                '/van-hanh/dang-nhap',
                '/van-hanh/%2e%2e/',
                '/van-hanh/dat-coc?q=' + 'á'.repeat(100),
              ]) {
                const response = await request(
                  '/ops/auth/login?returnTo=' + encodeURIComponent(path),
                );
                assert.equal(response.status, 400);
                assert.equal(response.headers.get('location'), null);
              }
              const unbound = await begin();
              const mismatch = new URL(unbound.callback);
              mismatch.searchParams.set(
                'state',
                randomBytes(32).toString('base64url'),
              );
              assert.equal(
                (await finish({ ...unbound, callback: mismatch })).status,
                403,
              );
              assert.equal(
                (await finish({ ...unbound, loginCookie: guestCookie })).status,
                403,
              );
              await client.query(
                "UPDATE ba_anh_em.staff_login_attempts SET expires_at = now() - interval '1 second' WHERE token_digest = $1",
                [digest(unbound.loginCookie)],
              );
              assert.equal((await finish(unbound)).status, 403);
              const valid = await begin();
              const attempts = () =>
                client.query(
                  'SELECT token_digest FROM ba_anh_em.staff_login_attempts ORDER BY token_digest',
                );
              assert.deepEqual(
                (await attempts()).rows.map((row) => row.token_digest),
                [digest(valid.loginCookie)],
              );
              const forbiddenPage = await finish(
                await begin({}, '/van-hanh/bao-cao'),
              );
              assert.equal(forbiddenPage.status, 403);
              assert.equal(forbiddenPage.headers.get('location'), null);
              assert.equal(forbiddenPage.headers.get('set-cookie'), null);
              assert.equal(
                await attempts().then((result) => result.rowCount),
                1,
              );

              const unavailable = await finish(
                await begin({ unavailable: true }),
              );
              assert.equal(unavailable.status, 503);
              assert.equal(
                (await unavailable.json()).code,
                'DEPENDENCY_UNAVAILABLE',
              );
              assert.equal((await finish(valid)).status, 303);
              await client.query('DELETE FROM ba_anh_em.staff_sessions');

              for (const input of [
                { invalidSignature: true },
                { claims: { nonce: 'wrong-nonce' } },
                { claims: { aud: 'wrong-audience' } },
                { claims: { iss: 'https://wrong-issuer.example' } },
                { claims: { exp: 1 } },
                { claims: { sub: 'fixture-unknown' } },
                { claims: { sub: 'fixture-other' } },
              ]) {
                const response = await finish(await begin(input));
                assert.equal(response.status, 403);
                assert.equal(response.headers.get('set-cookie'), null);
                assert.equal((await response.json()).code, 'FORBIDDEN');
              }
            },
          );

          await suite.test(
            'exchanges a valid code once and checks venue, grants, idle time, account state and logout',
            async () => {
              const attempt = await begin();
              const results = await Promise.all([
                finish(attempt),
                finish(attempt),
              ]);
              assert.deepEqual(
                results.map((response) => response.status).sort(),
                [303, 403],
              );
              const successful = results.find(
                (response) => response.status === 303,
              );
              assert.equal(
                successful.headers.get('location'),
                '/van-hanh/thuc-don',
              );
              assert.equal(
                takeCookie(successful, loginCookieName),
                loginCookieName + '=',
              );
              const staffCookie = takeCookie(successful, staffCookieName);
              const getSession = (cookie = staffCookie) =>
                request('/ops/session', { headers: { Cookie: cookie } });
              const sessionResponse = await getSession();
              assert.equal(sessionResponse.status, 200);
              const body = await sessionResponse.json();
              validateSession('/ops/session', 'get', body);
              assert.equal(body.displayName, 'Nhân sự kiểm thử');
              assert.equal(body.displayRole, 'admin');
              assert.deepEqual(body.permissions, ['menu.read']);
              secrets.push(staffCookie, body.csrfToken);
              const {
                rows: [stored],
              } = await client.query(
                'SELECT token_digest, venue_id FROM ba_anh_em.staff_sessions',
              );
              assert.deepEqual(stored.token_digest, digest(staffCookie));
              assert.equal(stored.venue_id, venue.id);

              const guard = app.get(StaffSessionService);
              const headers = {
                origin,
                cookie: staffCookie,
                'x-csrf-token': body.csrfToken,
              };
              assert.equal(
                await guard.requirePermission(
                  headers,
                  venue.id,
                  'menu.read',
                  false,
                ),
                staff.id,
              );
              await assert.rejects(
                guard.requirePermission(
                  headers,
                  otherVenue.id,
                  'menu.write',
                  false,
                ),
                { status: 403 },
              );
              await assert.rejects(
                guard.requirePermission(headers, venue.id, 'menu.write', true),
                { status: 403 },
              );
              await assert.rejects(
                guard.requirePermission(
                  { ...headers, 'x-csrf-token': undefined },
                  venue.id,
                  'menu.read',
                  true,
                ),
                { status: 403 },
              );
              await assert.rejects(
                app.get(GuestSessionService).requireWriteSession(headers),
                { status: 401 },
              );
              await client.query(
                "INSERT INTO ba_anh_em.staff_venue_grants VALUES ($1,$2,'menu.write')",
                [staff.id, venue.id],
              );
              assert.deepEqual(
                (await (await getSession()).json()).permissions,
                ['menu.read'],
              );
              await client.query(
                "DELETE FROM ba_anh_em.staff_venue_grants WHERE staff_user_id = $1 AND venue_id = $2 AND permission = 'menu.read'",
                [staff.id, venue.id],
              );
              assert.equal((await getSession()).status, 403);

              await client.query(
                "INSERT INTO ba_anh_em.staff_venue_grants VALUES ($1,$2,'kitchen.read')",
                [staff.id, venue.id],
              );
              const renewed = await finish(
                await begin({}, '/van-hanh'),
                staffCookie,
              );
              assert.equal(renewed.status, 303);
              assert.equal(
                renewed.headers.get('location'),
                '/van-hanh/chuan-bi-bep',
              );
              const newCookie = takeCookie(renewed, staffCookieName);
              assert.notEqual(newCookie, staffCookie);
              assert.equal((await getSession()).status, 401);
              const current = await (await getSession(newCookie)).json();
              assert.deepEqual(current.permissions, [
                'kitchen.read',
                'menu.write',
              ]);
              const logout = (logoutOrigin, csrf) =>
                request('/ops/session', {
                  method: 'DELETE',
                  headers: {
                    Origin: logoutOrigin,
                    Cookie: newCookie,
                    'X-CSRF-Token': csrf,
                  },
                });
              assert.equal(
                (
                  await logout(
                    'https://cross-origin.example',
                    current.csrfToken,
                  )
                ).status,
                403,
              );
              assert.equal((await logout(origin, body.csrfToken)).status, 403);
              assert.equal((await getSession(newCookie)).status, 200);
              const ended = await logout(origin, current.csrfToken);
              assert.equal(ended.status, 204);
              assert.equal(
                takeCookie(ended, staffCookieName),
                staffCookieName + '=',
              );
              assert.equal((await getSession(newCookie)).status, 401);

              const idle = takeCookie(
                await finish(await begin({}, '/van-hanh')),
                staffCookieName,
              );
              await client.query(
                "UPDATE ba_anh_em.staff_sessions SET created_at = now() - interval '1 hour', idle_expires_at = now() - interval '1 second' WHERE token_digest = $1",
                [digest(idle)],
              );
              assert.equal((await getSession(idle)).status, 401);
              const absolute = takeCookie(
                await finish(await begin({}, '/van-hanh')),
                staffCookieName,
              );
              await client.query(
                "UPDATE ba_anh_em.staff_sessions SET created_at = now() - interval '1 hour', idle_expires_at = now() - interval '2 seconds', expires_at = now() - interval '1 second' WHERE token_digest = $1",
                [digest(absolute)],
              );
              assert.equal((await getSession(absolute)).status, 401);
              const active = takeCookie(
                await finish(await begin({}, '/van-hanh')),
                staffCookieName,
              );
              await client.query(
                'UPDATE ba_anh_em.staff_users SET active = false WHERE id = $1',
                [staff.id],
              );
              assert.equal((await getSession(active)).status, 401);
            },
          );
        });

        for (const secret of secrets)
          assert.ok(
            !JSON.stringify(logs).includes(secret),
            'log contains a private authentication value',
          );
        for (const event of [
          'staff.login.succeeded',
          'staff.oidc.rejected',
          'staff.login.denied',
          'staff.access.denied',
          'staff.logout.succeeded',
        ]) {
          assert.ok(
            logs.some((entry) => entry.event === event),
            `missing ${event}`,
          );
        }
      },
    );
  },
);
