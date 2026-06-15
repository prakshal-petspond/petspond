import type {
  CheckInBoardResponse,
  CollectPaymentDto,
  ConsultationBooking,
  CreateWalkInDto,
  PaymentsBoardResponse,
  QueueBoardResponse,
  UpdateQueueStatusDto,
} from '@petspond/types';
import type { ApiClient } from '@petspond/api-client';

const PREFIX = '/vet/front-desk';

export const frontDeskApi = {
  getCheckIn(client: ApiClient) {
    return client.get<CheckInBoardResponse>(`${PREFIX}/check-in`);
  },

  search(client: ApiClient, q: string) {
    return client.get<ConsultationBooking[]>(`${PREFIX}/search`, { q });
  },

  checkIn(client: ApiClient, bookingId: string) {
    return client.post<ConsultationBooking>(`${PREFIX}/consultations/${bookingId}/check-in`, {});
  },

  createWalkIn(client: ApiClient, data: CreateWalkInDto) {
    return client.post<ConsultationBooking>(`${PREFIX}/consultations/walk-in`, data);
  },

  markNoShow(client: ApiClient, bookingId: string) {
    return client.patch<ConsultationBooking>(`${PREFIX}/consultations/${bookingId}/no-show`, {});
  },

  getQueue(client: ApiClient) {
    return client.get<QueueBoardResponse>(`${PREFIX}/queue`);
  },

  updateQueue(client: ApiClient, bookingId: string, data: UpdateQueueStatusDto) {
    return client.patch<ConsultationBooking>(`${PREFIX}/consultations/${bookingId}/queue`, data);
  },

  getPayments(client: ApiClient, filter: 'all' | 'pending' | 'paid' | 'refunded' = 'all') {
    return client.get<PaymentsBoardResponse>(`${PREFIX}/payments`, { filter });
  },

  collectPayment(client: ApiClient, bookingId: string, data?: CollectPaymentDto) {
    return client.post<ConsultationBooking>(
      `${PREFIX}/consultations/${bookingId}/collect-payment`,
      data ?? {},
    );
  },
};
