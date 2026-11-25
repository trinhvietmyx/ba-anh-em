import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import { DatabaseService } from '../db/database.service';
import { ApiException } from '../http/api-error.filter';

interface HealthResponse {
  status: 'ok';
}

const headers = {
  'Cache-Control': { schema: { type: 'string', enum: ['no-store'] } },
  'X-Trace-Id': { schema: { type: 'string', format: 'uuid' } },
};

const okResponse: ApiResponseOptions = {
  headers,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['status'],
    properties: { status: { type: 'string', enum: ['ok'] } },
    example: { status: 'ok' },
  },
};

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('live')
  @ApiOperation({
    operationId: 'getLiveness',
    summary: 'Kiểm tra tiến trình API',
    security: [],
  })
  @ApiOkResponse(okResponse)
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    operationId: 'getReadiness',
    summary: 'Kiểm tra PostgreSQL 17 và migration nền',
    security: [],
  })
  @ApiOkResponse(okResponse)
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL 17 hoặc schema nền chưa sẵn sàng.',
    headers,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message', 'traceId', 'retryable'],
      properties: {
        code: { type: 'string', enum: ['NOT_READY'] },
        message: { type: 'string' },
        traceId: { type: 'string', format: 'uuid' },
        retryable: { type: 'boolean', enum: [true] },
      },
      example: {
        code: 'NOT_READY',
        message: 'Dịch vụ chưa sẵn sàng.',
        traceId: '0ce7b2a3-2a56-495b-9ab9-199e20597bd5',
        retryable: true,
      },
    },
  })
  async ready(): Promise<HealthResponse> {
    if (!(await this.database.isReady())) {
      throw new ApiException(
        { code: 'NOT_READY', message: 'Dịch vụ chưa sẵn sàng.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ok' };
  }
}
