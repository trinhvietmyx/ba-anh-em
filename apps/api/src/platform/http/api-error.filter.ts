import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';

interface ApiProblem {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export class ApiException extends HttpException {
  constructor(
    readonly problem: ApiProblem,
    status: number,
  ) {
    super(problem, status);
  }
}

const responseProblems: Partial<Record<number, ApiProblem>> = {
  400: { code: 'INVALID_REQUEST', message: 'Dữ liệu yêu cầu không hợp lệ.' },
  401: {
    code: 'SESSION_REQUIRED',
    message: 'Vui lòng tiếp tục với phiên hợp lệ.',
  },
  403: {
    code: 'FORBIDDEN',
    message: 'Bạn không có quyền thực hiện yêu cầu này.',
  },
  404: { code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy tài nguyên.' },
  409: {
    code: 'STATE_CONFLICT',
    message: 'Yêu cầu xung đột với trạng thái hiện tại.',
  },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Nội dung yêu cầu quá lớn.' },
  415: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Định dạng yêu cầu không được hỗ trợ.',
  },
  422: {
    code: 'RULE_VIOLATION',
    message: 'Dữ liệu không đáp ứng điều kiện xử lý.',
  },
  429: { code: 'RATE_LIMITED', message: 'Vui lòng đợi trước khi gửi lại.' },
  500: {
    code: 'INTERNAL_ERROR',
    message: 'Máy chủ gặp lỗi khi xử lý yêu cầu.',
  },
  503: {
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'Dịch vụ tạm thời chưa sẵn sàng.',
  },
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<ServerResponse>();
    if (response.headersSent) {
      response.end();
      return;
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const problem =
      exception instanceof ApiException
        ? exception.problem
        : (responseProblems[status] ?? {
            code: `HTTP_${status}`,
            message: 'Không thể hoàn tất yêu cầu.',
          });
    const requestTrace = response.getHeader('X-Trace-Id');
    const traceId =
      typeof requestTrace === 'string' ? requestTrace : randomUUID();

    response.setHeader('X-Trace-Id', traceId);
    response.setHeader('Cache-Control', 'no-store');
    this.adapterHost.httpAdapter.reply(
      response,
      {
        ...problem,
        traceId,
        retryable: [429, 502, 503, 504].includes(status),
      },
      status,
    );
  }
}
