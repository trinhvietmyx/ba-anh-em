import type { Booking, BookingDraft, Dish } from '../shared/model.ts';

export type ApiFieldErrors = Record<string, string | string[]>;

export interface ApiErrorPayload {
  code: string;
  message: string;
  fields?: ApiFieldErrors;
  traceId?: string;
  retryable?: boolean;
}

export class ApiServiceError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ApiFieldErrors;
  readonly traceId?: string;
  readonly retryable: boolean;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.code = payload.code;
    this.fields = payload.fields;
    this.traceId = payload.traceId;
    this.retryable = payload.retryable ?? false;
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<T>(path: string, options?: HttpRequestOptions): Promise<T>;
}

/** In-memory service contract used by the interface while the API is pending. */
export interface RestaurantService {
  getMenu(): Promise<Dish[]>;
  getReservations(): Promise<Booking[]>;
  createReservation(draft: BookingDraft): Promise<Booking | null>;
  updateReservation(
    id: string,
    patch: Partial<Booking>,
    note?: string,
  ): Promise<Booking | undefined>;
  replaceMenu(dishes: Dish[]): Promise<Dish[]>;
}

export interface MockRestaurantSeed {
  dishes: Dish[];
  bookings: Booking[];
  firstReservationNumber?: number;
}
