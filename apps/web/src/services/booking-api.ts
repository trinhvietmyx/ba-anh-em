import type { operations } from '@ba-anh-em/api-contract';
import { createHttpClient } from './http-client';

type Availability =
  operations['getAvailability']['responses'][200]['content']['application/json'];
type GuestSession =
  operations['establishGuestSession']['responses'][200]['content']['application/json'];
export type SavedBooking =
  operations['getGuestReservation']['responses'][200]['content']['application/json'];
export type NewBooking =
  operations['createReservation']['requestBody']['content']['application/json'];

const api = createHttpClient();
export const bookingUsesApi = import.meta.env.VITE_BOOKING_SOURCE === 'api';

export const bookingApi = {
  availability(date: string, guests: number) {
    const query = new URLSearchParams({ date, guests: String(guests) });
    return api.request<Availability>(`/availability?${query}`, {
      signal: AbortSignal.timeout(8_000),
    });
  },
  session() {
    return api.request<GuestSession>('/guest/session', {
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
    });
  },
  create(payload: NewBooking, key: string, csrfToken: string) {
    return api.request<SavedBooking>('/reservations', {
      method: 'POST',
      body: payload,
      headers: { 'Idempotency-Key': key, 'X-CSRF-Token': csrfToken },
      signal: AbortSignal.timeout(8_000),
    });
  },
  attempt(key: string) {
    return api.request<SavedBooking>('/guest/reservation-attempts', {
      headers: { 'Idempotency-Key': key },
      signal: AbortSignal.timeout(8_000),
    });
  },
  get(id: string, signal: AbortSignal) {
    return api.request<SavedBooking>(
      `/reservations/${encodeURIComponent(id)}`,
      { signal },
    );
  },
};
