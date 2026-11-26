const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const { createApiApp } = require('../../dist/api-app.js');
const {
  readRuntimeConfig,
} = require('../../dist/platform/config/runtime-config.js');
const {
  StaffSessionService,
} = require('../../dist/modules/auth/staff-session.service.js');
const {
  withPostgres,
  command,
  temporaryDatabase,
} = require('./database-fixture.cjs');
const contract = require('@ba-anh-em/api-contract/openapi.json');
const Ajv = require('ajv/dist/2020').default;

const origin = 'http://127.0.0.1:5173';
const issuer = 'https://fixture.example';
const venueCode = 'BAE-TEST-FIXTURE';

test('menu returns unavailable when the menu venue is unconfigured', async () => {
  const app = await createApiApp(readRuntimeConfig({}), false);
  try {
    await app.listen(0, '127.0.0.1');
    const response = await fetch(`${await app.getUrl()}/api/v1/menu`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'DEPENDENCY_UNAVAILABLE');
  } finally {
    await app.close();
  }
});

test('limits repeated requests to menu endpoints before database work', async () => {
  const app = await createApiApp(
    readRuntimeConfig({
      MENU_VENUE_CODE: venueCode,
      APP_ORIGIN: origin,
      AUTH_RATE_LIMIT_PER_MINUTE: '2',
    }),
    false,
  );
  try {
    await app.listen(0, '127.0.0.1');
    for (const expected of [503, 503, 429]) {
      const response = await fetch(`${await app.getUrl()}/api/v1/menu`);
      assert.equal(response.status, expected);
      if (expected === 429) {
        assert.match(response.headers.get('retry-after'), /^\d+$/);
        assert.equal((await response.json()).code, 'RATE_LIMITED');
      }
    }
  } finally {
    await app.close();
  }
});

function verifyResponse(path, method, status, body) {
  const schema =
    contract.paths['/api/v1' + path][method].responses[status].content[
      'application/json'
    ].schema;
  const validate = new Ajv({ strict: false }).compile(schema);
  assert.ok(validate(body), JSON.stringify(validate.errors));
}

test(
  'stores and publishes menu changes on PostgreSQL within staff privileges',
  withPostgres,
  async (t) => {
    const { client, url } = await temporaryDatabase(t);
    for (const [name, env] of [
      ['migrate', { MIGRATION_DATABASE_URL: url }],
      ['seed-test', { BAE_TEST_SEED_DATABASE_URL: url }],
      ['seed-menu-test', { BAE_TEST_SEED_DATABASE_URL: url }],
    ]) {
      const result = command(name, env);
      assert.equal(result.status, 0, result.stderr);
    }
    const {
      rows: [venue],
    } = await client.query('SELECT id FROM ba_anh_em.venues WHERE code = $1', [
      venueCode,
    ]);
    const {
      rows: [otherVenue],
    } = await client.query(
      "INSERT INTO ba_anh_em.venues (code, name, time_zone) VALUES ('OTHER', 'Other', 'Asia/Ho_Chi_Minh') RETURNING id",
    );
    await client.query(
      "UPDATE ba_anh_em.menu_items SET available = false WHERE venue_id = $1 AND public_key = 'lau-bo-sa-te'",
      [venue.id],
    );
    await client.query(
      "UPDATE ba_anh_em.menu_items SET published = false WHERE venue_id = $1 AND public_key = 'goi-buoi-tom'",
      [venue.id],
    );
    await client.query(
      "INSERT INTO ba_anh_em.menu_items (venue_id, public_key, name, category, price_vnd, published) VALUES ($1,'other-only','Exclusively other venue','Test',1,true)",
      [otherVenue.id],
    );
    const seededAgain = command('seed-menu-test', {
      BAE_TEST_SEED_DATABASE_URL: url,
    });
    assert.equal(seededAgain.status, 0, seededAgain.stderr);

    const config = {
      NODE_ENV: 'test',
      DATABASE_URL: url,
      MENU_VENUE_CODE: venueCode,
      APP_ORIGIN: origin,
      GUEST_SESSION_TTL_SECONDS: '3600',
      OIDC_ISSUER: issuer,
      OIDC_CLIENT_ID: 'fixture-app',
      OIDC_CLIENT_SECRET: 'fixture-secret',
      STAFF_VENUE_CODE: venueCode,
      STAFF_SESSION_TTL_SECONDS: '3600',
      STAFF_SESSION_IDLE_SECONDS: '900',
    };
    const app = await createApiApp(readRuntimeConfig(config), false);
    try {
      await app.listen(0, '127.0.0.1');
      const base = (await app.getUrl()) + '/api/v1';
      const sessionService = app.get(StaffSessionService);
      const request = async (path, options) => {
        const response = await fetch(base + path, options);
        return {
          status: response.status,
          body: await response.json(),
          headers: response.headers,
        };
      };
      async function staff(subject, permissions, currentVenue = venue.id) {
        const {
          rows: [user],
        } = await client.query(
          "INSERT INTO ba_anh_em.staff_users (oidc_issuer, oidc_subject, display_name, display_role) VALUES ($1,$2,$2,'admin') RETURNING id",
          [issuer, subject],
        );
        for (const permission of permissions)
          await client.query(
            'INSERT INTO ba_anh_em.staff_venue_grants VALUES ($1,$2,$3)',
            [user.id, currentVenue, permission],
          );
        const { token } = await sessionService.create({}, issuer, subject, [
          { path: '/van-hanh', permission: permissions[0] },
        ]);
        const Cookie = '__Host-bae_staff=' + token;
        const session = await request('/ops/session', { headers: { Cookie } });
        assert.equal(session.status, 200);
        return {
          Cookie,
          'X-CSRF-Token': session.body.csrfToken,
          Origin: origin,
        };
      }

      const published = await request('/menu');
      assert.equal(published.status, 200);
      verifyResponse('/menu', 'get', 200, published.body);
      assert.equal(published.body.items[0].id, 'ga-nuong-la-chanh');
      assert.equal(
        published.body.items.find((dish) => dish.id === 'lau-bo-sa-te')
          .available,
        false,
      );
      assert.ok(
        published.body.items.every(
          (dish) =>
            dish.published && !['goi-buoi-tom', 'other-only'].includes(dish.id),
        ),
      );

      const guest = await request('/guest/session', {
        method: 'POST',
        headers: { Origin: origin },
      });
      const guestCookie = guest.headers.getSetCookie()[0].split(';')[0];
      assert.equal((await request('/ops/menu')).status, 401);
      assert.equal(
        (await request('/ops/menu', { headers: { Cookie: guestCookie } }))
          .status,
        401,
      );
      const other = await staff('kitchen', ['kitchen.read']);
      assert.equal(
        (await request('/ops/menu', { headers: other })).status,
        403,
      );
      const read = await staff('viewer', ['menu.read']);
      const readMenu = await request('/ops/menu', { headers: read });
      assert.equal(readMenu.status, 200);
      verifyResponse('/ops/menu', 'get', 200, readMenu.body);
      assert.equal(
        readMenu.body.items.find(({ dish }) => dish.id === 'goi-buoi-tom').dish
          .published,
        false,
      );
      const writeOnly = await staff('writer-only', ['menu.write']);
      const write = await staff('editor', ['menu.read', 'menu.write']);
      const input = {
        name: 'Món kiểm thử',
        category: 'Khai vị',
        price: 123_000,
        description: 'Mô tả thử.',
        available: true,
        published: false,
      };
      function save(path, method, body, headers = write, key = randomUUID()) {
        return request(path, {
          method,
          body: JSON.stringify(body),
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Idempotency-Key': key,
          },
        });
      }
      assert.equal((await save('/ops/menu', 'POST', input, read)).status, 403);
      assert.equal(
        (await save('/ops/menu', 'POST', input, writeOnly)).status,
        403,
      );
      assert.equal(
        (
          await save('/ops/menu', 'POST', input, {
            ...write,
            Origin: 'https://outside.example',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await save('/ops/menu', 'POST', input, {
            ...write,
            'X-CSRF-Token': 'invalid',
          })
        ).status,
        403,
      );
      for (const invalid of [
        { price: 100_000_001 },
        { image: '/images/menu/unused.jpg' },
        { id: 'bad' },
        { description: '  ' },
      ]) {
        assert.equal(
          (await save('/ops/menu', 'POST', { ...input, ...invalid })).status,
          422,
        );
      }

      const createKey = randomUUID();
      const [created, repeated] = await Promise.all([
        save('/ops/menu', 'POST', input, write, createKey),
        save('/ops/menu', 'POST', input, write, createKey),
      ]);
      assert.equal(created.status, 201);
      assert.equal(repeated.status, 201);
      assert.deepEqual(repeated.body, created.body);
      verifyResponse('/ops/menu', 'post', 201, created.body);
      assert.match(created.body.dish.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.equal(created.body.version, 1);
      assert.equal(
        (
          await save(
            '/ops/menu',
            'POST',
            { ...input, price: 1 },
            write,
            createKey,
          )
        ).status,
        409,
      );
      assert.ok(
        !(await request('/menu')).body.items.some(
          (dish) => dish.id === created.body.dish.id,
        ),
      );

      const path = `/ops/menu/${created.body.dish.id}`;
      const change = {
        expectedVersion: 1,
        item: { ...input, price: 127_000, published: true, available: false },
      };
      const keys = [randomUUID(), randomUUID()];
      const updates = await Promise.all(
        keys.map((key) => save(path, 'PUT', change, write, key)),
      );
      assert.deepEqual(
        updates.map((result) => result.status).sort(),
        [200, 409],
      );
      const changed = updates.find((result) => result.status === 200);
      verifyResponse('/ops/menu/{dishId}', 'put', 200, changed.body);
      assert.equal(changed.body.version, 2);
      assert.deepEqual(
        (await save(path, 'PUT', change, write, keys[updates.indexOf(changed)]))
          .body,
        changed.body,
      );
      const dish = (await request('/menu')).body.items.find(
        (item) => item.id === created.body.dish.id,
      );
      assert.equal(dish.price, 127_000);
      assert.equal(dish.available, false);
      assert.equal(dish.published, true);
      assert.equal(
        (await save('/ops/menu/other-only', 'PUT', change)).status,
        404,
      );
      const retriedCreate = await save(
        '/ops/menu',
        'POST',
        input,
        write,
        createKey,
      );
      assert.deepEqual(retriedCreate.body, changed.body);
      const { rowCount } = await client.query(
        'SELECT id FROM ba_anh_em.menu_items WHERE name = $1',
        [input.name],
      );
      assert.equal(rowCount, 1);
    } finally {
      await app.close();
    }
  },
);
