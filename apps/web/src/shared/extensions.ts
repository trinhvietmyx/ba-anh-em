export type Decision = 'pending' | 'accepted' | 'declined';

export interface ChangeRequest {
  bookingId: string;
  kind: 'reschedule' | 'cancel';
  date: string;
  time: string;
  guests: number;
  reason: string;
  status: Decision;
  decisionNote?: string;
  depositFollowUp?: boolean;
}

export interface EventRequestData {
  id: string;
  date: string;
  time: string;
  guests: number;
  kind: string;
  note: string;
  name: string;
  phone: string;
  status: Decision;
  decisionNote?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment: string;
  status: 'pending' | 'published' | 'declined';
  moderationNote?: string;
}
