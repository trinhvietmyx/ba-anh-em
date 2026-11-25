import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { ConsoleLogger } from '@nestjs/common';
import { createApiApp } from './api-app';
import {
  readApiEnvironment,
  readRuntimeConfig,
} from './platform/config/runtime-config';

const logger = new ConsoleLogger('Bootstrap', { json: true });

function loadLocalEnvironment(): void {
  const envPath = resolve(__dirname, '../../../.env');

  if (
    readApiEnvironment(process.env.NODE_ENV) !== 'production' &&
    existsSync(envPath)
  ) {
    try {
      loadEnvFile(envPath);
    } catch {
      throw new Error('Không thể đọc cấu hình API từ .env.');
    }
  }
}

async function bootstrap(): Promise<void> {
  let config;
  try {
    loadLocalEnvironment();
    config = readRuntimeConfig(process.env);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : 'Cấu hình API không hợp lệ.',
    );
    process.exitCode = 1;
    return;
  }

  const app = await createApiApp(config, logger);
  app.enableShutdownHooks();

  try {
    await app.listen(config.port, config.host);
  } catch (error) {
    await app.close();
    throw error;
  }
}

bootstrap().catch((error: unknown) => {
  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'EADDRINUSE'
  ) {
    logger.error('API_PORT đang được sử dụng. Hãy chọn cổng khác.');
  } else {
    logger.error('Không thể khởi động API.');
  }
  process.exitCode = 1;
});
