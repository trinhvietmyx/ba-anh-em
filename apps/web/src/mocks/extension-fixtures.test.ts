import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_DATE, TIMES } from '../shared/model.ts';
import { MOCK_EVENTS, MOCK_REVIEWS } from './extension-fixtures.ts';

test('keeps the approved sample event data outside UI components', () => {
  assert.deepEqual(MOCK_EVENTS, [
    {
      id: 'TIEC-2001',
      date: DEMO_DATE,
      time: TIMES[0],
      guests: 12,
      kind: 'Họp mặt gia đình',
      note: 'Gia đình có hai trẻ nhỏ, muốn ngồi cùng khu vực.',
      name: 'Minh An',
      phone: '0900002001',
      status: 'pending',
    },
  ]);
});

test('keeps the approved sample review data outside UI components', () => {
  assert.deepEqual(MOCK_REVIEWS, [
    {
      id: 'DG-3001',
      bookingId: 'BAE-1036',
      rating: 5,
      comment: 'Món lên đúng giờ. Lúc cần thêm ghế, nhân viên mang ra ngay.',
      status: 'published',
    },
  ]);
});
