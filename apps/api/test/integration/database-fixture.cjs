const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { join } = require('node:path');
const { Client } = require('pg');

const adminUrl = process.env.BAE_TEST_POSTGRES_ADMIN_URL;
const cli = join(__dirname, '../../dist/platform/db/database-cli.js');
const withPostgres = { skip: !adminUrl };

function command(name, env, args = []) {
  const result = spawnSync(process.execPath, [cli, name, ...args], {
    env: { ...process.env, NODE_ENV: 'test', ...env },
    encoding: 'utf8',
    timeout: 25000,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return result;
}

async function temporaryDatabase(t, prefix = 'bae_test') {
  const suffix = randomBytes(6).toString('hex');
  const databaseName = `${prefix}_${suffix}`;
  const admin = new Client({ connectionString: adminUrl });
  const url = new URL(adminUrl);
  url.pathname = '/' + databaseName;
  const client = new Client({ connectionString: url.href });
  let created = false;
  let connected = false;
  await admin.connect();
  t.after(async () => {
    try {
      if (connected) await client.end();
      if (created) await admin.query(`DROP DATABASE "${databaseName}"`);
    } finally {
      await admin.end();
    }
  });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  created = true;
  await client.connect();
  connected = true;
  return { client, url: url.href };
}

module.exports = { withPostgres, command, temporaryDatabase };
