import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import { EndpointRateLimitGuard } from '../../platform/http/endpoint-rate-limit.guard';
import { GuestSessionService } from './guest-session.service';
import {
  GUEST_COOKIE,
  LOGIN_COOKIE,
  sessionCookie,
  STAFF_COOKIE,
} from './session-security';
import { StaffAuthService } from './staff-auth.service';
import {
  STAFF_PERMISSIONS,
  StaffSessionService,
} from './staff-session.service';

const originHeader = {
  name: 'Origin',
  required: true,
  description: 'Origin của ứng dụng.',
};
const privateHeaders = {
  'Cache-Control': { schema: { type: 'string', enum: ['no-store'] } },
  'X-Trace-Id': { schema: { type: 'string', format: 'uuid' } },
};
const cookieHeaders = {
  ...privateHeaders,
  'Set-Cookie': {
    schema: { type: 'string' },
    description: 'Cookie HttpOnly, Secure, SameSite=Lax.',
  },
};
const redirectHeaders = {
  ...cookieHeaders,
  Location: { schema: { type: 'string', format: 'uri-reference' } },
};
const sessionProperties = {
  csrfToken: {
    type: 'string',
    minLength: 43,
    maxLength: 43,
    pattern: '^[A-Za-z0-9_-]{43}$',
  },
  expiresAt: { type: 'string', format: 'date-time' },
};
const staffProperties = {
  ...sessionProperties,
  displayName: { type: 'string', minLength: 1, maxLength: 120 },
  displayRole: { type: 'string', enum: ['employee', 'admin'] },
  permissions: {
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    items: { type: 'string', enum: [...STAFF_PERMISSIONS] },
  },
};

const problems: Record<number, string> = {
  400: 'Tham số không hợp lệ.',
  401: 'Thiếu phiên hoặc phiên đã hết hạn.',
  403: 'Yêu cầu bị từ chối.',
  429: 'Đã vượt giới hạn tần suất của endpoint.',
  500: 'Lỗi xử lý nội bộ.',
  503: 'Cấu hình phiên hoặc dịch vụ phụ thuộc chưa sẵn sàng.',
};

function ApiSessionProblems(...statuses: number[]) {
  return applyDecorators(
    ...[...statuses, 429, 500, 503].map((status) =>
      ApiResponse({
        status,
        description: problems[status],
        headers:
          status === 429
            ? {
                ...privateHeaders,
                'Retry-After': { schema: { type: 'integer', minimum: 1 } },
              }
            : privateHeaders,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['code', 'message', 'traceId', 'retryable'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            traceId: { type: 'string', format: 'uuid' },
            retryable: { type: 'boolean' },
          },
        },
      }),
    ),
  );
}

function sessionResponse(
  properties: typeof sessionProperties,
  headers: ApiResponseOptions['headers'],
): ApiResponseOptions {
  return {
    status: 200,
    description: 'Phiên còn hiệu lực.',
    headers,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties,
      required: Object.keys(properties),
    },
  };
}

@ApiTags('Phiên')
@Controller()
@UseGuards(EndpointRateLimitGuard)
export class AuthController {
  constructor(
    private readonly guests: GuestSessionService,
    private readonly auth: StaffAuthService,
    private readonly staff: StaffSessionService,
  ) {}

  @Post('guest/session')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'establishGuestSession',
    summary: 'Thiết lập hoặc phục hồi phiên khách',
    security: [],
  })
  @ApiHeader(originHeader)
  @ApiResponse(sessionResponse(sessionProperties, cookieHeaders))
  @ApiSessionProblems(403)
  async establishGuest(
    @Req() request: IncomingMessage,
    @Res({ passthrough: true }) response: ServerResponse,
  ) {
    const result = await this.guests.establish(request.headers);
    if (result.cookie)
      response.setHeader(
        'Set-Cookie',
        sessionCookie(GUEST_COOKIE, result.cookie.token, result.cookie.ttl),
      );
    return result.body;
  }

  @Get('ops/auth/login')
  @HttpCode(302)
  @ApiOperation({
    operationId: 'beginStaffLogin',
    summary: 'Bắt đầu đăng nhập OIDC',
    security: [],
  })
  @ApiQuery({
    name: 'returnTo',
    required: false,
    schema: { type: 'string', maxLength: 512 },
  })
  @ApiResponse({
    status: 302,
    description: 'Chuyển sang IdP.',
    headers: redirectHeaders,
  })
  @ApiSessionProblems(400)
  async beginStaffLogin(
    @Query('returnTo') returnTo: unknown,
    @Res({ passthrough: true }) response: ServerResponse,
  ) {
    const result = await this.auth.begin(returnTo);
    response.setHeader(
      'Set-Cookie',
      sessionCookie(LOGIN_COOKIE, result.token, result.ttl),
    );
    response.setHeader('Location', result.location);
  }

  @Get('ops/auth/callback')
  @HttpCode(303)
  @ApiOperation({
    operationId: 'finishStaffLogin',
    summary: 'Hoàn thành đăng nhập OIDC',
    security: [],
  })
  @ApiQuery({
    name: 'code',
    required: false,
    schema: { type: 'string', maxLength: 4096 },
  })
  @ApiQuery({
    name: 'state',
    required: false,
    schema: { type: 'string', maxLength: 512 },
  })
  @ApiQuery({
    name: 'error',
    required: false,
    schema: { type: 'string', maxLength: 160 },
  })
  @ApiResponse({
    status: 303,
    description: 'Đăng nhập thành công.',
    headers: redirectHeaders,
  })
  @ApiSessionProblems(400, 403)
  async finishStaffLogin(
    @Req() request: IncomingMessage,
    @Res({ passthrough: true }) response: ServerResponse,
  ) {
    const result = await this.auth.finish(request.headers, request.url ?? '');
    response.setHeader('Set-Cookie', [
      sessionCookie(LOGIN_COOKIE, '', 0),
      sessionCookie(STAFF_COOKIE, result.token, result.ttl),
    ]);
    response.setHeader('Location', result.location);
  }

  @Get('ops/session')
  @ApiOperation({
    operationId: 'getStaffSession',
    summary: 'Đọc phiên nhân sự hiện tại',
    security: [{ StaffCookie: [] }],
  })
  @ApiResponse(sessionResponse(staffProperties, privateHeaders))
  @ApiSessionProblems(401, 403)
  getStaffSession(@Req() request: IncomingMessage) {
    return this.staff.get(request.headers);
  }

  @Delete('ops/session')
  @HttpCode(204)
  @ApiOperation({
    operationId: 'endStaffSession',
    summary: 'Đăng xuất khỏi khu vận hành',
    security: [{ StaffCookie: [], CsrfToken: [] }],
  })
  @ApiHeader(originHeader)
  @ApiResponse({
    status: 204,
    description: 'Đã thu hồi phiên.',
    headers: cookieHeaders,
  })
  @ApiSessionProblems(401, 403)
  async endStaffSession(
    @Req() request: IncomingMessage,
    @Res({ passthrough: true }) response: ServerResponse,
  ) {
    await this.staff.end(request.headers);
    response.setHeader('Set-Cookie', sessionCookie(STAFF_COOKIE, '', 0));
  }
}
