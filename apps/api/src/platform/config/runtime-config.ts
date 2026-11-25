import { isIP } from 'node:net';
import { readApiPort } from './api-port';

export interface RuntimeConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  databaseUrl?: string;
  exposeDocs: boolean;
}

export const RUNTIME_CONFIG = Symbol('RUNTIME_CONFIG');

export function readApiEnvironment(
  value: string | undefined,
): 'development' | 'test' | 'production' {
  const environment = value ?? 'development';
  if (
    environment !== 'development' &&
    environment !== 'test' &&
    environment !== 'production'
  ) {
    throw new Error('NODE_ENV must be development, test or production');
  }
  return environment;
}

function readCorsOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return [];

  const origins = value.split(',').map((entry) => entry.trim());
  for (const origin of origins) {
    const url = URL.parse(origin);
    if (
      !url ||
      !['http:', 'https:'].includes(url.protocol) ||
      url.origin !== origin
    ) {
      throw new Error(
        'API_CORS_ORIGINS must contain comma-separated HTTP origins',
      );
    }
  }

  return [...new Set(origins)];
}

function readDatabaseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const url = URL.parse(value);
  if (
    !url ||
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname ||
    url.port === '0' ||
    url.pathname.length < 2
  ) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL URL with a host and database name',
    );
  }

  return value;
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const environment = readApiEnvironment(env.NODE_ENV);
  const host = env.API_HOST ?? '127.0.0.1';
  if (!isIP(host)) throw new Error('API_HOST must be an IPv4 or IPv6 address');

  return {
    host,
    port: readApiPort(env.API_PORT),
    corsOrigins: readCorsOrigins(env.API_CORS_ORIGINS),
    databaseUrl: readDatabaseUrl(env.DATABASE_URL),
    exposeDocs: environment !== 'production',
  };
}
