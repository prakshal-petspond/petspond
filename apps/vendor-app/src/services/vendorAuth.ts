import type { ApiClient } from '@petspond/api-client';
import type {
  Vendor,
  VendorCompleteOnboardingDto,
  VendorUpdateProfileDto,
  VendorVerifyOtpResponse,
} from '@petspond/types';

export function sendVendorOtp(client: ApiClient, mobile: string) {
  return client.post<{ success: boolean; message?: string }>('/vendor-auth/send-otp', {
    mobile,
    countryCode: '91',
  });
}

export function verifyVendorOtp(client: ApiClient, mobile: string, otp: string) {
  return client.post<VendorVerifyOtpResponse>('/vendor-auth/verify-otp', { mobile, otp });
}

export function fetchVendorMe(client: ApiClient) {
  return client.get<Vendor>('/vendor-auth/me');
}

export function completeVendorOnboarding(client: ApiClient, body: VendorCompleteOnboardingDto) {
  return client.post<Vendor>('/vendor-auth/complete-onboarding', body);
}

export function updateVendorProfile(client: ApiClient, body: VendorUpdateProfileDto) {
  return client.patch<Vendor>('/vendor-auth/profile', body);
}
