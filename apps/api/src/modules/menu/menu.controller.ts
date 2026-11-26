import type { IncomingMessage } from 'node:http';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  type SchemaObject,
} from '@nestjs/swagger';
import { EndpointRateLimitGuard } from '../../platform/http/endpoint-rate-limit.guard';
import {
  DISH_KEY_PATTERN,
  MAX_MENU_PRICE,
  MAX_VERSION,
  MenuItemDto,
  UpdateMenuItemDto,
} from './menu.dto';
import { REQUEST_KEY_PATTERN } from '../../platform/http/idempotency-key';
import { MenuService } from './menu.service';

const dishId = {
  type: 'string',
  minLength: 1,
  maxLength: 120,
  pattern: DISH_KEY_PATTERN,
} as const;
const version = { type: 'integer', minimum: 1, maximum: MAX_VERSION } as const;
const writeProperties = {
  name: { type: 'string', maxLength: 90, pattern: '\\S' },
  category: { type: 'string', maxLength: 60, pattern: '\\S' },
  price: { type: 'integer', minimum: 1, maximum: MAX_MENU_PRICE },
  description: { type: 'string', maxLength: 300 },
  available: { type: 'boolean' },
  published: { type: 'boolean' },
} satisfies Record<string, SchemaObject>;

function object(properties: Record<string, SchemaObject>): SchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

const dish = object({
  id: dishId,
  name: { type: 'string', minLength: 1, maxLength: 160 },
  category: { type: 'string', minLength: 1, maxLength: 100 },
  price: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
  description: { type: 'string', maxLength: 4000 },
  image: { anyOf: [{ type: 'string', maxLength: 2048 }, { type: 'null' }] },
  available: { type: 'boolean' },
  published: { type: 'boolean' },
});
const publicDish = {
  ...dish,
  properties: {
    ...dish.properties,
    published: { type: 'boolean', enum: [true] },
  },
};
const opsDish = object({ dish, version });
const operationErrors = {
  400: 'Mã món hoặc khóa gửi lại không hợp lệ.',
  401: 'Thiếu phiên nhân sự hợp lệ.',
  403: 'Yêu cầu bị từ chối.',
  404: 'Không tìm thấy món trong nhà hàng.',
  409: 'Xung đột phiên bản hoặc khóa gửi lại.',
  422: 'Dữ liệu món không hợp lệ.',
  429: 'Đã vượt giới hạn tần suất của endpoint.',
  500: 'Lỗi xử lý nội bộ.',
  503: 'Nguồn thực đơn chưa sẵn sàng.',
};

function ApiMenuErrors(...statuses: Array<keyof typeof operationErrors>) {
  const allStatuses: Array<keyof typeof operationErrors> = [
    ...statuses,
    429,
    500,
    503,
  ];
  return applyDecorators(
    ...allStatuses.map((status) =>
      ApiResponse({
        status,
        description: operationErrors[status],
        ...(status === 429
          ? {
              headers: {
                'Retry-After': { schema: { type: 'integer', minimum: 1 } },
              },
            }
          : {}),
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['code', 'message', 'traceId', 'retryable'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            traceId: { type: 'string', format: 'uuid' },
            retryable: { type: 'boolean' },
            fields: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      }),
    ),
  );
}

function ApiMenuWrite() {
  return applyDecorators(
    ApiHeader({
      name: 'Origin',
      required: true,
      description: 'Origin của ứng dụng.',
    }),
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      schema: {
        type: 'string',
        minLength: 16,
        maxLength: 128,
        pattern: REQUEST_KEY_PATTERN,
      },
    }),
    ApiMenuErrors(400, 401, 403, 409, 422),
  );
}

@Controller()
@ApiTags('Thực đơn')
@UseGuards(EndpointRateLimitGuard)
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get('menu')
  @ApiOperation({
    operationId: 'listPublishedMenu',
    summary: 'Đọc thực đơn đã công bố',
    security: [],
  })
  @ApiResponse({
    status: 200,
    description: 'Danh mục công bố.',
    schema: object({ items: { type: 'array', items: publicDish } }),
  })
  @ApiMenuErrors()
  listPublished() {
    return this.menu.listPublished();
  }

  @Get('ops/menu')
  @ApiOperation({
    operationId: 'listOpsMenu',
    summary: 'Đọc danh mục quản lý thực đơn',
    security: [{ StaffCookie: [] }],
  })
  @ApiResponse({
    status: 200,
    description: 'Danh mục vận hành.',
    schema: object({ items: { type: 'array', items: opsDish } }),
  })
  @ApiMenuErrors(401, 403)
  listForStaff(@Req() request: IncomingMessage) {
    return this.menu.listForStaff(request.headers);
  }

  @Post('ops/menu')
  @ApiOperation({
    operationId: 'createOpsMenuItem',
    summary: 'Tạo món',
    security: [{ StaffCookie: [], CsrfToken: [] }],
  })
  @ApiMenuWrite()
  @ApiBody({
    schema: object({
      ...writeProperties,
      description: { ...writeProperties.description, pattern: '\\S' },
    }),
  })
  @ApiResponse({
    status: 201,
    description: 'Món đã tạo hoặc kết quả gửi lại.',
    schema: opsDish,
  })
  create(@Req() request: IncomingMessage, @Body() item: MenuItemDto) {
    return this.menu.save(request.headers, item);
  }

  @Put('ops/menu/:dishId')
  @ApiOperation({
    operationId: 'updateOpsMenuItem',
    summary: 'Lưu thông tin và trạng thái món',
    security: [{ StaffCookie: [], CsrfToken: [] }],
  })
  @ApiMenuWrite()
  @ApiMenuErrors(404)
  @ApiParam({ name: 'dishId', required: true, schema: dishId })
  @ApiBody({
    schema: object({ expectedVersion: version, item: object(writeProperties) }),
  })
  @ApiResponse({
    status: 200,
    description: 'Món và phiên bản hiện tại.',
    schema: opsDish,
  })
  update(
    @Req() request: IncomingMessage,
    @Param('dishId') dishId: string,
    @Body() input: UpdateMenuItemDto,
  ) {
    return this.menu.save(request.headers, input.item, {
      dishId,
      expectedVersion: input.expectedVersion,
    });
  }
}
