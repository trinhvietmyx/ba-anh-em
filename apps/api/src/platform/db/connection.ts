import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

export const isPostgres17 = sql<boolean>`
  current_setting('server_version_num')::integer BETWEEN 170000 AND 179999
`;

export function createDatabase(
  connectionString: string,
  timeoutMs: number,
  onIdleError: () => void,
): Kysely<object> {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: timeoutMs,
    query_timeout: timeoutMs,
    statement_timeout: timeoutMs,
  });
  pool.on('error', onIdleError);

  return new Kysely({ dialect: new PostgresDialect({ pool }) });
}
