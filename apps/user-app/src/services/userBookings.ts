import type { ApiClient } from '@petspond/api-client';
import type {
  ConsultationBooking,
  CreateConsultationBookingDto,
  CreateVaccinationBookingDto,
  VaccinationBooking,
} from '@petspond/types';

export function createConsultationBooking(client: ApiClient, body: CreateConsultationBookingDto) {
  return client.post<ConsultationBooking>('/user/bookings/consultations', body);
}

export function confirmConsultationPayment(
  client: ApiClient,
  bookingId: string,
  stripeSessionId?: string,
) {
  return client.post<ConsultationBooking>(`/user/bookings/consultations/${bookingId}/confirm-payment`, {
    stripeSessionId,
  });
}

export function createVaccinationBooking(client: ApiClient, body: CreateVaccinationBookingDto) {
  return client.post<VaccinationBooking>('/user/bookings/vaccinations', body);
}

export function confirmVaccinationPayment(
  client: ApiClient,
  bookingId: string,
  stripeSessionId?: string,
) {
  return client.post<VaccinationBooking>(`/user/bookings/vaccinations/${bookingId}/confirm-payment`, {
    stripeSessionId,
  });
}

export function listUserConsultations(client: ApiClient) {
  return client.get<ConsultationBooking[]>('/user/bookings/consultations');
}

export function listUserVaccinations(client: ApiClient) {
  return client.get<VaccinationBooking[]>('/user/bookings/vaccinations');
}
