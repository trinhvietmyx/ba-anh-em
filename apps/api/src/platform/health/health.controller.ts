import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DatabaseService } from '../db/database.service';
import { ApiException } from '../http/api-error.filter';

class HealthResponse {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('live')
  @ApiOkResponse({ type: HealthResponse })
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({ type: HealthResponse })
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL 17 hoặc schema nền chưa sẵn sàng.',
    schema: {
      type: 'object',
      required: ['code', 'message', 'traceId', 'retryable'],
      properties: {
        code: { type: 'string', enum: ['NOT_READY'] },
        message: { type: 'string' },
        traceId: { type: 'string', format: 'uuid' },
        retryable: { type: 'boolean' },
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
