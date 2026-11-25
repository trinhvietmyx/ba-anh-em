import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/runtime-config';

const DATABASE_TIMEOUT_MS = 1500;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly db?: Kysely<object>;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    if (!config.databaseUrl) return;

    const pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: DATABASE_TIMEOUT_MS,
      query_timeout: DATABASE_TIMEOUT_MS,
      statement_timeout: DATABASE_TIMEOUT_MS,
    });
    pool.on('error', () => this.logger.warn('database.idle_connection_failed'));
    this.db = new Kysely({ dialect: new PostgresDialect({ pool }) });
  }

  async isReady(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = await sql<{ ready: boolean }>`
        SELECT current_setting('server_version_num')::integer
                 BETWEEN 170000 AND 179999
               AND COALESCE(
                 has_table_privilege(to_regclass('ba_anh_em.venues'), 'SELECT'),
                 false
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
