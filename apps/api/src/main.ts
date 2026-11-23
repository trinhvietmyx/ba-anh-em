import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readApiPort } from './platform/config/api-port';

async function bootstrap(): Promise<void> {
  const envPath = resolve(__dirname, '../../../.env');

  if (process.env.NODE_ENV !== 'production' && existsSync(envPath)) {
    loadEnvFile(envPath);
  }

  const port = readApiPort(process.env.API_PORT);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(port, '127.0.0.1');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
