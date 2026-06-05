import type { ApiClient } from '@petspond/api-client';
import type { PublicVendorDetail, PublicVendorListItem, VendorServiceType } from '@petspond/types';

export function fetchPublicVendors(
  client: ApiClient,
  params: { type?: VendorServiceType; lat?: number; lng?: number; q?: string },
) {
  const query: Record<string, string> = {};
  if (params.type) query.type = params.type;
  if (params.lat != null) query.lat = String(params.lat);
  if (params.lng != null) query.lng = String(params.lng);
  if (params.q) query.q = params.q;
  return client.get<PublicVendorListItem[]>('/public/vendors', query);
}

export function fetchPublicVendorDetail(
  client: ApiClient,
  id: string,
  params?: { lat?: number; lng?: number },
) {
  const query: Record<string, string> = {};
  if (params?.lat != null) query.lat = String(params.lat);
  if (params?.lng != null) query.lng = String(params.lng);
  return client.get<PublicVendorDetail>(`/public/vendors/${id}`, query);
}
