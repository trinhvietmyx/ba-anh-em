import { DEMO_DATE, TIMES } from '../shared/model.ts';
import type { EventRequestData, Review } from '../shared/extensions.ts';

export const MOCK_EVENTS: EventRequestData[] = [
  {
    id: 'TIEC-2001',
    date: DEMO_DATE,
    time: TIMES[0] ?? '11:00',
    guests: 12,
    kind: 'Họp mặt gia đình',
    note: 'Gia đình có hai trẻ nhỏ, muốn ngồi cùng khu vực.',
    name: 'Minh An',
    phone: '0900002001',
    status: 'pending',
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'DG-3001',
    bookingId: 'BAE-1036',
    rating: 5,
    comment: 'Món lên đúng giờ. Lúc cần thêm ghế, nhân viên mang ra ngay.',
    status: 'published',
  },
];
