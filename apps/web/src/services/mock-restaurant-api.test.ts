import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_DATE } from '../shared/model.ts';
import { createMockRestaurantApi } from './mock-restaurant-api.ts';

const dish = {
  id: 'ga-nuong',
  name: 'Gà nướng lá chanh',
  category: 'Món nướng',
  price: 329_000,
  description: 'Gà nướng lá chanh.',
  available: true,
  published: true,
};

const draft = {
  date: DEMO_DATE,
  time: '18:00',
  guests: 4,
  name: 'Khách thử',
  phone: '0900000001',
  note: '',
  source: 'web' as const,
};

test('returns detached menu data so a view cannot mutate the mock store', async () => {
  const api = createMockRestaurantApi({ dishes: [dish], bookings: [] });
  const menu = await api.getMenu();
  menu[0]!.name = 'Tên đã sửa tại giao diện';

  assert.equal((await api.getMenu())[0]!.name, dish.name);
});

test('creates a reservation through the existing business rule and returns its identifier', async () => {
  const api = createMockRestaurantApi({ dishes: [dish], bookings: [] });
  const booking = await api.createReservation(draft);

  assert.ok(booking);
  assert.equal(booking.id, 'BAE-1044');
  assert.equal(booking.source, 'web');
  assert.equal((await api.getReservations()).length, 1);
});

test('updates are visible to other mock API reads', async () => {
  const api = createMockRestaurantApi({ dishes: [dish], bookings: [] });
  const booking = await api.createReservation(draft);
  assert.ok(booking);

  await api.updateReservation(
    booking.id,
    { status: 'confirmed' },
    'Đã xác nhận.',
  );

  const saved = (await api.getReservations())[0];
  assert.equal(saved?.status, 'confirmed');
  assert.equal(saved?.history[0], 'Đã xác nhận.');
});
