import type { ApiClient } from '@petspond/api-client';
import type { PublicClinicDetail, PublicClinicListItem } from '@petspond/types';

export async function fetchConsultationClinics(client: ApiClient): Promise<PublicClinicListItem[]> {
  return client.get<PublicClinicListItem[]>('/public/clinics', { purpose: 'consultation' });
}

export async function fetchVaccinationClinics(client: ApiClient): Promise<PublicClinicListItem[]> {
  return client.get<PublicClinicListItem[]>('/public/clinics', { purpose: 'vaccination' });
}

export async function fetchClinicDetail(client: ApiClient, clinicId: string): Promise<PublicClinicDetail> {
  return client.get<PublicClinicDetail>(`/public/clinics/${clinicId}`);
}
