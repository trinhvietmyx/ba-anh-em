const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const {
  withPostgres,
  command,
  temporaryDatabase,
} = require('./database-fixture.cjs');

test('migration CLI requires a separate migration URL', () => {
  const result = command('migrate', {
    MIGRATION_DATABASE_URL: '',
    DATABASE_URL: 'postgresql://fixture-secret@example.invalid/runtime',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /MIGRATION_DATABASE_URL/);
  assert.doesNotMatch(result.stderr, /fixture-secret/);
});

test(
  'applies the foundation, auth and menu once and seeds a stable fixture',
  withPostgres,
  async (t) => {
    const { client, url } = await temporaryDatabase(t);
    const migrate = () => command('migrate', { MIGRATION_DATABASE_URL: url });
    const seed = () =>
      command('seed-test', { BAE_TEST_SEED_DATABASE_URL: url });
    for (let attempt = 0; attempt < 2; attempt++) {
      const migration = migrate();
      assert.equal(migration.status, 0, migration.stderr);
      const seeded = seed();
      assert.equal(seeded.status, 0, seeded.stderr);
    }

    const versions = await client.query(
      'SELECT name FROM ba_anh_em.kysely_migration ORDER BY name',
    );
    assert.deepEqual(versions.rows, [
      { name: '001_base' },
      { name: '002_auth' },
      { name: '003_menu' },
      { name: '004_booking' },
    ]);
    const extension = await client.query(
      "SELECT extname FROM pg_extension WHERE extname = 'btree_gist'",
    );
    assert.equal(extension.rowCount, 1);
    const layout = await client.query(`
    SELECT (SELECT count(*)::int FROM ba_anh_em.venues) AS venues,
           (SELECT count(*)::int FROM ba_anh_em.dining_areas) AS areas,
           (SELECT count(*)::int FROM ba_anh_em.dining_tables) AS tables,
           (SELECT count(*)::int FROM ba_anh_em.service_rules) AS rules,
           (SELECT count(*)::int FROM ba_anh_em.service_day_overrides) AS exceptions,
           (SELECT count(*)::int FROM ba_anh_em.service_override_windows) AS windows
  `);
    assert.deepEqual(layout.rows[0], {
      venues: 1,
      areas: 2,
      tables: 3,
      rules: 1,
      exceptions: 2,
      windows: 1,
    });

    await client.query("UPDATE ba_anh_em.venues SET name = 'Local test edit'");
    await client.query(
      "UPDATE ba_anh_em.service_rules SET closes_at = '20:00'",
    );
    await client.query(
      "UPDATE ba_anh_em.service_override_windows SET opens_at = '13:00'",
    );
    assert.equal(seed().status, 0);
    assert.equal(
      (await client.query('SELECT name FROM ba_anh_em.venues')).rows[0].name,
      'Local test edit',
    );
    assert.deepEqual(
      (await client.query('SELECT closes_at FROM ba_anh_em.service_rules'))
        .rows,
      [{ closes_at: '20:00:00' }],
    );
    assert.deepEqual(
      (
        await client.query(
          'SELECT opens_at FROM ba_anh_em.service_override_windows',
        )
      ).rows,
      [{ opens_at: '13:00:00' }],
    );
  },
);

test(
  'rolls back partial DDL and can retry after resolving the conflict',
  withPostgres,
  async (t) => {
    const { client, url } = await temporaryDatabase(t);
    await client.query('CREATE SCHEMA ba_anh_em');
    await client.query('CREATE TABLE ba_anh_em.service_rules (marker text)');

    const failed = command('migrate', { MIGRATION_DATABASE_URL: url });
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /001_base/);
    const { rows } = await client.query(
      "SELECT to_regclass('ba_anh_em.venues') AS venues",
    );
    assert.equal(rows[0].venues, null);
    assert.deepEqual(
      (await client.query('SELECT name FROM ba_anh_em.kysely_migration')).rows,
      [],
    );

    await client.query('DROP TABLE ba_anh_em.service_rules');
    const retry = command('migrate', { MIGRATION_DATABASE_URL: url });
    assert.equal(retry.status, 0, retry.stderr);
    assert.equal(
      (await client.query('SELECT name FROM ba_anh_em.kysely_migration'))
        .rowCount,
      4,
    );
  },
);

test(
  'fixture seed refuses a database outside the test naming convention',
  withPostgres,
  async (t) => {
    const { url } = await temporaryDatabase(t, 'bae_control');
    const result = command('seed-test', { BAE_TEST_SEED_DATABASE_URL: url });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /_test/);
  },
);

test(
  'upgrades an existing 001_base database without changing its data',
  withPostgres,
  async (t) => {
    const { client, url } = await temporaryDatabase(t);
    const { Migrator } = require('kysely/migration');
    const { createDatabase } = require('../../dist/platform/db/connection.js');
    const foundation = require('../../dist/platform/db/migrations/001-base.js');
    const db = createDatabase(url, 15000, () => {});
    try {
      const result = await new Migrator({
        db,
        migrationTableSchema: 'ba_anh_em',
        provider: { getMigrations: async () => ({ '001_base': foundation }) },
      }).migrateToLatest();
      assert.ifError(result.error);
    } finally {
      await db.destroy();
    }
    await client.query(
      "INSERT INTO ba_anh_em.venues (code, name, time_zone) VALUES ('before-auth', 'Existing venue', 'Asia/Ho_Chi_Minh')",
    );

    const { createApiApp } = require('../../dist/api-app.js');
    const {
      readRuntimeConfig,
    } = require('../../dist/platform/config/runtime-config.js');
    const app = await createApiApp(
      readRuntimeConfig({ DATABASE_URL: url }),
      false,
    );
    try {
      await app.listen(0, '127.0.0.1');
      const response = await fetch(`${await app.getUrl()}/api/v1/health/ready`);
      assert.equal(response.status, 503);
      assert.equal((await response.json()).code, 'NOT_READY');
      const migration = command('migrate', { MIGRATION_DATABASE_URL: url });
      assert.equal(migration.status, 0, migration.stderr);
      const upgraded = await fetch(`${await app.getUrl()}/api/v1/health/ready`);
      assert.equal(upgraded.status, 200);
      assert.deepEqual(await upgraded.json(), { status: 'ok' });
      assert.deepEqual(
        (await client.query('SELECT code, name FROM ba_anh_em.venues')).rows,
        [{ code: 'before-auth', name: 'Existing venue' }],
      );
    } finally {
      await app.close();
    }
  },
);
