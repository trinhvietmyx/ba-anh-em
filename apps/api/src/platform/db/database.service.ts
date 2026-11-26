import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/runtime-config';
import { createDatabase, isPostgres17 } from './connection';
import {
  AUTH_MIGRATION,
  BOOKING_MIGRATION,
  DATABASE_SCHEMA,
  FOUNDATION_MIGRATION,
  MENU_MIGRATION,
  MIGRATION_TABLE,
} from './migration-history';

const DATABASE_TIMEOUT_MS = 1500;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly db?: Kysely<object>;
  private readonly logger = new Logger(DatabaseService.name);

  get connection(): Kysely<object> | undefined {
    return this.db;
  }

  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    if (!config.databaseUrl) return;

    this.db = createDatabase(config.databaseUrl, DATABASE_TIMEOUT_MS, () =>
      this.logger.warn('database.idle_connection_failed'),
    );
  }

  async isReady(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = await sql<{ ready: boolean }>`
        SELECT ${isPostgres17}
               AND COALESCE(
                 has_table_privilege(to_regclass(${`${DATABASE_SCHEMA}.venues`}), 'SELECT'),
                 false
               )
               AND (
                 SELECT count(*) = 4 FROM ${sql.table(`${DATABASE_SCHEMA}.${MIGRATION_TABLE}`)}
                 WHERE name IN (${FOUNDATION_MIGRATION}, ${AUTH_MIGRATION}, ${MENU_MIGRATION}, ${BOOKING_MIGRATION})
               ) AS ready
      `.execute(this.db);
      return result.rows[0]?.ready === true;
    } catch {
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.db?.destroy();
  }
}
