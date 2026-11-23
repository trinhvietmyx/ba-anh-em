import {
  ApiServiceError,
  type ApiClient,
  type HttpRequestOptions,
} from './contracts.ts';

const DEFAULT_ERROR_MESSAGE = 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
const INVALID_RESPONSE_MESSAGE = 'Máy chủ trả về dữ liệu không hợp lệ.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseErrorPayload(value: unknown, status: number) {
  if (!isRecord(value)) {
    return {
      code: `HTTP_${status}`,
      message: DEFAULT_ERROR_MESSAGE,
      retryable: status >= 500 || status === 429,
    };
  }

  const fields = isRecord(value.fields)
    ? Object.fromEntries(
        Object.entries(value.fields).filter(
          (entry): entry is [string, string | string[]] =>
            typeof entry[1] === 'string' ||
            (Array.isArray(entry[1]) &&
              entry[1].every((item) => typeof item === 'string')),
        ),
      )
    : undefined;

  return {
    code: typeof value.code === 'string' ? value.code : `HTTP_${status}`,
    message:
      typeof value.message === 'string' ? value.message : DEFAULT_ERROR_MESSAGE,
    fields,
    traceId: typeof value.traceId === 'string' ? value.traceId : undefined,
    retryable:
      typeof value.retryable === 'boolean'
        ? value.retryable
        : status >= 500 || status === 429,
  };
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  let payload: unknown;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiServiceError(response.status, {
      code: 'INVALID_RESPONSE',
      message: INVALID_RESPONSE_MESSAGE,
    });
  }

  if (!response.ok) {
    throw new ApiServiceError(
      response.status,
      parseErrorPayload(payload, response.status),
    );
  }

  if (payload === undefined) {
    throw new ApiServiceError(response.status, {
      code: 'INVALID_RESPONSE',
      message: INVALID_RESPONSE_MESSAGE,
    });
  }

  return payload as T;
}

export function createHttpClient(
  baseUrl = '/api/v1',
  fetcher: typeof fetch = fetch,
): ApiClient {
  return {
    async request<T>(path: string, options: HttpRequestOptions = {}) {
      const headers = new Headers(options.headers);
      headers.set('Accept', 'application/json');
      if (options.body !== undefined)
        headers.set('Content-Type', 'application/json');

      const response = await fetcher(
        `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        {
          method: options.method ?? 'GET',
          headers,
          ...(options.body === undefined
            ? {}
            : { body: JSON.stringify(options.body) }),
          ...(options.signal ? { signal: options.signal } : {}),
        },
      );

      return readApiResponse<T>(response);
    },
  };
}
