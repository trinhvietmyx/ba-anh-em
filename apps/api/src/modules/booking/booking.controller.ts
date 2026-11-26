import type { IncomingMessage } from 'node:http';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  type SchemaObject,
} from '@nestjs/swagger';
import { EndpointRateLimitGuard } from '../../platform/http/endpoint-rate-limit.guard';
import { REQUEST_KEY_PATTERN } from '../../platform/http/idempotency-key';
import { AvailabilityService } from './availability.service';
import {
  availabilityQuery,
  CreateReservationDto,
  DATE_PATTERN,
  MAX_BOOKING_GUESTS,
  PHONE_PATTERN,
  TIME_PATTERN,
} from './booking.dto';
import { BookingService, RESERVATION_CODE_PATTERN } from './booking.service';

function object(
  properties: Record<string, SchemaObject>,
  required = Object.keys(properties),
): SchemaObject {
  return { type: 'object', additionalProperties: false, properties, required };
}

const day = { type: 'string', pattern: DATE_PATTERN, format: 'date' } as const;
const time = { type: 'string', pattern: TIME_PATTERN } as const;
const instant = { type: 'string', format: 'date-time' } as const;
const party = {
  type: 'integer',
  minimum: 1,
  maximum: MAX_BOOKING_GUESTS,
} as const;
const code = { type: 'string', pattern: RESERVATION_CODE_PATTERN } as const;
const emptyList = { type: 'array', maxItems: 0, items: {} } as const;
const availability = object({
  date: day,
  guests: party,
  timeZone: { type: 'string' },
  slots: {
    type: 'array',
    items: object({
      time,
      startsAt: instant,
      available: { type: 'boolean' },
      reason: {
        anyOf: [
          { type: 'null' },
          {
            type: 'string',
            enum: [
              'CAPACITY_UNAVAILABLE',
              'SLOT_CLOSED',
              'BOOKING_WINDOW_CLOSED',
            ],
          },
        ],
      },
    }),
  },
});
const reservation = object({
  id: code,
  date: day,
  time,
  startsAt: instant,
  endsAt: instant,
  guests: party,
  source: { type: 'string', enum: ['web', 'chat'] },
  status: {
    type: 'string',
    enum: [
      'pending',
      'confirmed',
      'arrived',
      'completed',
      'no-show',
      'cancelled',
    ],
  },
  statusReason: {
    anyOf: [{ type: 'string', maxLength: 64 }, { type: 'null' }],
  },
  version: { type: 'integer', minimum: 1, maximum: 2147483647 },
  items: emptyList,
  tables: emptyList,
  preorderTotal: { type: 'integer', enum: [0] },
  deposit: { type: 'null' },
  nextActions: emptyList,
});
const create = object(
  {
    date: day,
    time,
    guests: party,
    contact: object({
      name: { type: 'string', minLength: 2, maxLength: 80 },
      phone: {
        type: 'string',
        minLength: 7,
        maxLength: 24,
        pattern: PHONE_PATTERN,
      },
    }),
    note: { type: 'string', maxLength: 200 },
  },
  ['date', 'time', 'guests', 'contact'],
);
const problem = object(
  {
    code: { type: 'string' },
    message: { type: 'string' },
    traceId: { type: 'string', format: 'uuid' },
    retryable: { type: 'boolean' },
    fields: {
      type: 'object',
      additionalProperties: { type: 'array', items: { type: 'string' } },
    },
  },
  ['code', 'message', 'traceId', 'retryable'],
);
const errors = {
  400: 'Mã lượt hoặc khóa gửi lại không hợp lệ.',
  401: 'Thiếu phiên khách hợp lệ.',
  403: 'Origin hoặc CSRF không hợp lệ.',
  404: 'Không tìm thấy kết quả trong phiên.',
  409: 'Xung đột sức chứa hoặc khóa gửi lại.',
  422: 'Dữ liệu hoặc khung giờ không hợp lệ.',
  429: 'Đã vượt giới hạn tần suất.',
  500: 'Lỗi xử lý nội bộ.',
  503: 'Chế độ thử đặt bàn chưa sẵn sàng.',
};
function ApiBookingErrors(...expected: Array<keyof typeof errors>) {
  const statuses: Array<keyof typeof errors> = [...expected, 429, 500, 503];
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: errors[status],
        schema: problem,
        ...(status === 429
          ? {
              headers: {
                'Retry-After': { schema: { type: 'integer', minimum: 1 } },
              },
            }
          : {}),
      }),
    ),
  );
}
const requestKey = {
  name: 'Idempotency-Key',
  required: true,
  schema: { type: 'string', pattern: REQUEST_KEY_PATTERN },
} as const;

@Controller()
@ApiTags('Đặt chỗ')
@UseGuards(EndpointRateLimitGuard)
export class BookingController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly bookings: BookingService,
  ) {}

  @Get('availability')
  @ApiOperation({
    operationId: 'getAvailability',
    summary: 'Tra khung giờ cho ngày và số khách',
  })
  @ApiQuery({ name: 'date', required: true, schema: day })
  @ApiQuery({ name: 'guests', required: true, schema: party })
  @ApiQuery({ name: 'time', required: false, schema: time })
  @ApiResponse({
    status: 200,
    description: 'Tình trạng từng khung theo lịch local.',
    schema: availability,
  })
  @ApiBookingErrors(422)
  list(@Query() query: Record<string, unknown>) {
    return this.availability.list(availabilityQuery(query));
  }

  @Post('reservations')
  @ApiOperation({
    operationId: 'createReservation',
    summary: 'Tạo lượt đặt thử',
    security: [{ GuestCookie: [], CsrfToken: [] }],
  })
  @ApiHeader(requestKey)
  @ApiHeader({
    name: 'Origin',
    required: true,
    description: 'Origin của ứng dụng.',
  })
  @ApiBody({ required: true, schema: create })
  @ApiResponse({
    status: 201,
    description: 'Lượt đã ghi hoặc kết quả gửi lại của phiên.',
    schema: reservation,
  })
  @ApiBookingErrors(400, 401, 403, 404, 409, 422)
  save(@Req() request: IncomingMessage, @Body() input: CreateReservationDto) {
    return this.bookings.create(request.headers, input);
  }

  @Get('reservations/:id')
  @ApiOperation({
    operationId: 'getGuestReservation',
    summary: 'Đọc lượt thuộc phiên khách',
    security: [{ GuestCookie: [] }],
  })
  @ApiParam({ name: 'id', required: true, schema: code })
  @ApiResponse({
    status: 200,
    description: 'Kết quả của lượt đặt.',
    schema: reservation,
  })
  @ApiBookingErrors(400, 401, 404)
  get(@Req() request: IncomingMessage, @Param('id') id: string) {
    return this.bookings.get(request.headers, id);
  }

  @Get('guest/reservation-attempts')
  @ApiOperation({
    operationId: 'getReservationAttempt',
    summary: 'Phục hồi kết quả đã ghi từ khóa lần gửi',
    security: [{ GuestCookie: [] }],
  })
  @ApiHeader(requestKey)
  @ApiResponse({
    status: 200,
    description: 'Kết quả đã ghi của cùng lượt đặt.',
    schema: reservation,
  })
  @ApiBookingErrors(400, 401, 404)
  attempt(@Req() request: IncomingMessage) {
    return this.bookings.getAttempt(request.headers);
  }
}
