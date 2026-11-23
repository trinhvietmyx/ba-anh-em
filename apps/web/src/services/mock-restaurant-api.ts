import {
  BOOKINGS,
  DISHES,
  buildBooking,
  type Booking,
  type BookingDraft,
  type Dish,
} from '../shared/model.ts';
import type { MockRestaurantSeed, RestaurantService } from './contracts.ts';

export function createMockRestaurantApi(
  seed: MockRestaurantSeed = { dishes: DISHES, bookings: BOOKINGS },
): RestaurantService {
  let dishes = structuredClone(seed.dishes);
  let bookings = structuredClone(seed.bookings);
  let nextReservationNumber = seed.firstReservationNumber ?? 1044;

  return {
    async getMenu() {
      return structuredClone(dishes);
    },
    async getReservations() {
      return structuredClone(bookings);
    },
    async createReservation(draft: BookingDraft) {
      const booking = buildBooking(
        bookings,
        draft,
        `BAE-${nextReservationNumber}`,
      );
      if (!booking) return null;
      nextReservationNumber += 1;
      bookings = [booking, ...bookings];
      return structuredClone(booking);
    },
    async updateReservation(
      id: string,
      patch: Partial<Booking>,
      note?: string,
    ) {
      let updated: Booking | undefined;
      bookings = bookings.map((booking) => {
        if (booking.id !== id) return booking;
        updated = {
          ...booking,
          ...patch,
          history: note
            ? [note, ...booking.history]
            : (patch.history ?? booking.history),
        };
        return updated;
      });
      return updated ? structuredClone(updated) : undefined;
    },
    async replaceMenu(nextDishes: Dish[]) {
      dishes = structuredClone(nextDishes);
      return structuredClone(dishes);
    },
  };
}
