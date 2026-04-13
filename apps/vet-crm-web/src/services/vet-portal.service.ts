import type { ApiClient } from '@petspond/api-client';
import type {
  Clinic,
  ClinicInviteDto,
  ConsultationBooking,
  UpdateClinicDto,
  VaccinationBooking,
  Vet,
  VetWeeklyAvailabilityBlock,
} from '@petspond/types';

export type VetClinicPayload = { clinic: Clinic; vet: Vet };

export const vetPortalApi = {
  getClinic(client: ApiClient) {
    return client.get<VetClinicPayload>('/vet/clinic');
  },

  updateClinic(client: ApiClient, body: UpdateClinicDto) {
    return client.patch<Clinic>('/vet/clinic', body);
  },

  listInvites(client: ApiClient) {
    return client.get<ClinicInviteDto[]>('/vet/clinic/invites');
  },

  inviteDoctor(client: ApiClient, mobile: string) {
    return client.post<ClinicInviteDto>('/vet/clinic/invites', { mobile });
  },

  listConsultations(client: ApiClient) {
    return client.get<ConsultationBooking[]>('/vet/bookings/consultations');
  },

  patchConsultation(client: ApiClient, id: string, status: ConsultationBooking['status']) {
    return client.patch<ConsultationBooking>(`/vet/bookings/consultations/${id}`, { status });
  },

  listVaccinations(client: ApiClient) {
    return client.get<VaccinationBooking[]>('/vet/bookings/vaccinations');
  },

  patchVaccination(client: ApiClient, id: string, status: VaccinationBooking['status']) {
    return client.patch<VaccinationBooking>(`/vet/bookings/vaccinations/${id}`, { status });
  },

  getMySchedule(client: ApiClient) {
    return client.get<{ weeklyAvailability: VetWeeklyAvailabilityBlock[] }>('/vet/schedule');
  },

  updateMySchedule(client: ApiClient, weeklyAvailability: VetWeeklyAvailabilityBlock[]) {
    return client.patch<Vet>('/vet/schedule', { weeklyAvailability });
  },

  getTeamSchedules(client: ApiClient) {
    return client.get<
      { vetId: string; fullName: string; weeklyAvailability: VetWeeklyAvailabilityBlock[] }[]
    >('/vet/schedule/team');
  },
};
