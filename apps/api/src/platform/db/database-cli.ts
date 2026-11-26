import { readFile } from 'node:fs/promises';
import { sql, type Kysely } from 'kysely';
import { Migrator } from 'kysely/migration';
import {
  loadLocalEnvironment,
  readApiEnvironment,
  readDatabaseUrl,
} from '../config/runtime-config';
import { createDatabase, isPostgres17 } from './connection';
import { validateFoundationImport } from './foundation-import';
import {
  AUTH_MIGRATION,
  BOOKING_MIGRATION,
  DATABASE_SCHEMA,
  FOUNDATION_MIGRATION,
  MENU_MIGRATION,
  MIGRATION_TABLE,
} from './migration-history';
import * as foundation from './migrations/001-base';
import * as auth from './migrations/002-auth';
import * as menu from './migrations/003-menu';
import * as booking from './migrations/004-booking';
import { seedBookingTest } from './seed-booking-test';
import { seedFoundationTest } from './seed-foundation-test';
import { seedMenuTest } from './seed-menu-test';
import { TEST_DATABASE_SUFFIX } from './test-database';

class CommandError extends Error {}

function sqlState(error: unknown): string {
  const code =
    error instanceof Error && 'code' in error ? error.code : undefined;
  return typeof code === 'string' && /^[A-Z0-9]{5}$/.test(code)
    ? ` (SQLSTATE ${code})`
    : '';
}

async function validateImport(path: string | undefined): Promise<void> {
  if (!path) throw new CommandError('Cần đường dẫn tệp JSON bố trí nhà hàng.');
  let input: unknown;
  try {
    input = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new CommandError('Không đọc được tệp JSON bố trí nhà hàng.');
  }
  try {
    const layout = validateFoundationImport(input);
    console.log(
      `Dữ liệu hợp lệ. ${layout.areas.length} khu, ${layout.tables.length} bàn.`,
    );
  } catch (error) {
    throw new CommandError(
      error instanceof Error ? error.message : 'Dữ liệu không hợp lệ.',
    );
  }
}

async function migrate(db: Kysely<object>): Promise<void> {
  const migrator = new Migrator({
    db,
    migrationTableSchema: DATABASE_SCHEMA,
    migrationTableName: MIGRATION_TABLE,
    provider: {
      getMigrations: async () => ({
        [FOUNDATION_MIGRATION]: foundation,
        [AUTH_MIGRATION]: auth,
        [MENU_MIGRATION]: menu,
        [BOOKING_MIGRATION]: booking,
      }),
    },
  });
  const { error, results } = await migrator.migrateToLatest();
  if (error) {
    const failed = results?.find((result) => result.status === 'Error');
    throw new CommandError(
      `Migration${failed ? ` ${failed.migrationName}` : ''} thất bại${sqlState(error)}.`,
    );
  }
  console.log(
    results?.length
      ? `Đã áp dụng ${results.map((result) => result.migrationName).join(', ')}.`
      : 'Schema đã ở phiên bản mới nhất.',
  );
}

async function run(command: string | undefined): Promise<void> {
  if (command === 'validate-import') {
    await validateImport(process.argv[3]);
    return;
  }
  if (
    command !== 'migrate' &&
    command !== 'seed-test' &&
    command !== 'seed-menu-test' &&
    command !== 'seed-booking-test'
  ) {
    throw new CommandError(
      'Chọn migrate, seed-test, seed-menu-test, seed-booking-test hoặc validate-import.',
    );
  }

  const isSeed = command !== 'migrate';
  const variable = isSeed
    ? 'BAE_TEST_SEED_DATABASE_URL'
    : 'MIGRATION_DATABASE_URL';
  let url: string | undefined;
  try {
    loadLocalEnvironment();
    const environment = readApiEnvironment(process.env.NODE_ENV);
    if (isSeed && environment !== 'test') {
      throw new Error('Seed kiểm thử yêu cầu NODE_ENV=test.');
    }
    url = readDatabaseUrl(process.env[variable], variable);
  } catch (error) {
    throw new CommandError(
      error instanceof Error
        ? error.message
        : 'Cấu hình database không hợp lệ.',
    );
  }
  if (!url) throw new CommandError(`Cần khai báo ${variable}.`);

  const db = createDatabase(url, 15000, () =>
    console.error('Kết nối database rảnh bị ngắt.'),
  );
  try {
    const { rows } = await sql<{ supported: boolean; database_name: string }>`
      SELECT ${isPostgres17} AS supported, current_database() AS database_name
    `.execute(db);
    const target = rows[0];
    if (!target?.supported) throw new CommandError('Cần PostgreSQL 17.');
    if (isSeed) {
      if (!TEST_DATABASE_SUFFIX.test(target.database_name)) {
        throw new CommandError(
          'Database seed phải có hậu tố _test hoặc _test_<id>.',
        );
      }
      if (command === 'seed-menu-test') {
        const items = await seedMenuTest(db);
        console.log(
          `Đã nạp fixture kiểm thử thực đơn (${items} món trong nguồn).`,
        );
      } else if (command === 'seed-booking-test') {
        await seedBookingTest(db);
        console.log('Đã nạp lịch phục vụ kiểm thử đặt bàn.');
      } else {
        await seedFoundationTest(db);
        console.log('Đã áp dụng fixture kiểm thử nền.');
      }
    } else {
      await migrate(db);
    }
  } finally {
    await db.destroy();
  }
}

run(process.argv[2]).catch((error: unknown) => {
  console.error(
    error instanceof CommandError
      ? error.message
      : `Thao tác database thất bại${sqlState(error)}.`,
  );
  process.exitCode = 1;
});
