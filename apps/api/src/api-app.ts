import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConsoleLogger, type LoggerService } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { RuntimeConfig } from './platform/config/runtime-config';
import { ApiErrorFilter } from './platform/http/api-error.filter';
import { createValidationPipe } from './platform/http/validation';
import { createApiDocument } from './platform/openapi/api-document';

export async function createApiApp(
  config: RuntimeConfig,
  logger: LoggerService | false = new ConsoleLogger({ json: true }),
): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(config),
    { logger, bodyParser: false, abortOnError: false },
  );

  app.setGlobalPrefix('api/v1');
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(
    (request: IncomingMessage, response: ServerResponse, next: () => void) => {
      const traceId = randomUUID();
      const started = performance.now();
      response.setHeader('X-Trace-Id', traceId);
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('Referrer-Policy', 'no-referrer');

      if (logger) {
        response.once('finish', () =>
          logger.log(
            {
              event: 'http.request',
              traceId,
              method: request.method,
              status: response.statusCode,
              durationMs: Math.round(performance.now() - started),
            },
            'HTTP',
          ),
        );
      }

      next();
    },
  );

  if (config.corsOrigins.length > 0) {
    app.enableCors({
      origin: config.corsOrigins,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Idempotency-Key', 'X-CSRF-Token'],
      exposedHeaders: ['X-Trace-Id'],
    });
  }
  app.useBodyParser('json', { limit: '100kb' });
  app.useGlobalFilters(new ApiErrorFilter(app.get(HttpAdapterHost)));
  app.useGlobalPipes(createValidationPipe());

  if (config.exposeDocs) {
    SwaggerModule.setup('docs', app, () => createApiDocument(app), {
      useGlobalPrefix: true,
      jsonDocumentUrl: 'openapi.json',
      raw: ['json'],
    });
  }

  return app;
}
