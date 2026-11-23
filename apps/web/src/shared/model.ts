import {
  DEMO_DATE,
  MAX_DISH_QUANTITY,
  SCENARIOS,
  TABLES,
  TIMES,
} from '../mocks/fixtures.ts';

export type BookingStatus =
  'pending' | 'confirmed' | 'arrived' | 'completed' | 'no-show' | 'cancelled';
export type DepositState =
  'pending' | 'review' | 'verified' | 'exception' | 'expired';

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: number | string;
  available: boolean;
  published: boolean;
}

export interface OrderLine {
  dishId: string;
  quantity: number;
  unitPrice?: number;
}

export interface BookingDraft {
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  note: string;
  source: 'web' | 'chat';
}

export interface Booking extends BookingDraft {
  id: string;
  status: BookingStatus;
  tables: string[];
  items: OrderLine[];
  deposit: DepositState;
  received?: number;
  depositEvidence?: { transactionId: string; content: string };
  history: string[];
  kitchenChanged?: boolean;
}

export type Scenario = (typeof SCENARIOS)[number];

export function bookingOpen(booking: Booking) {
  return booking.status === 'pending' || booking.status === 'confirmed';
}

export function preparePreorder(
  items: OrderLine[],
  dishes: Dish[],
  draft: Record<string, number>,
) {
  const quantities = Object.fromEntries(
    items.map(({ dishId, quantity }) => [dishId, quantity]),
  );
  const transferred: Record<string, number> = {};

  for (const dish of dishes) {
    if (!dish.published || !dish.available) continue;
    const saved = quantities[dish.id] ?? 0;
    const extra = Math.min(draft[dish.id] ?? 0, MAX_DISH_QUANTITY - saved);
    if (extra > 0) {
      quantities[dish.id] = saved + extra;
      transferred[dish.id] = extra;
    }
  }

  return { quantities, transferred };
}

export function money(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function displayDate(date: string) {
  if (!date) return '—';
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(parsed);
}

function minutes(time: string) {
  const [hours = 0, mins = 0] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function isTableOccupied(
  bookings: Booking[],
  tableId: string,
  date: string,
  time: string,
  exceptId?: string,
) {
  return bookings.some(
    (booking) =>
      booking.id !== exceptId &&
      booking.date === date &&
      booking.tables.includes(tableId) &&
      ['pending', 'confirmed', 'arrived'].includes(booking.status) &&
      Math.abs(minutes(booking.time) - minutes(time)) < 90,
  );
}

function suitableTable(
  bookings: Booking[],
  date: string,
  time: string,
  guests: number,
) {
  return TABLES.find(
    (table) =>
      table.seats >= guests && !isTableOccupied(bookings, table.id, date, time),
  );
}

export function availableTimes(
  bookings: Booking[],
  date: string,
  guests: number,
) {
  return TIMES.map((time) => ({
    time,
    available:
      date >= DEMO_DATE &&
      guests > 0 &&
      Boolean(suitableTable(bookings, date, time, guests)),
  }));
}

export function buildBooking(
  bookings: Booking[],
  draft: BookingDraft,
  id: string,
): Booking | null {
  const table = suitableTable(bookings, draft.date, draft.time, draft.guests);
  if (
    !table ||
    draft.date < DEMO_DATE ||
    !TIMES.includes(draft.time) ||
    draft.guests < 1
  ) {
    return null;
  }

  return {
    ...draft,
    id,
    tables: [table.id],
    items: [],
    status: 'pending',
    deposit: 'pending',
    history: [
      `Tiếp nhận từ ${draft.source === 'chat' ? 'trợ lý AI' : 'website'} và giữ bàn tạm.`,
    ],
  };
}

export {
  BOOKINGS,
  DEPOSIT_AMOUNT,
  DISHES,
  MAX_DISH_QUANTITY,
  SCENARIOS,
  TABLES,
  TIMES,
} from '../mocks/fixtures.ts';
export { DEMO_DATE };
