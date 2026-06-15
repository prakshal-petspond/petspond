import type {
  Vet,
  Clinic,
  ClinicTeamResponse,
  VetVerifyOtpResponse,
  VetAuthResponse,
  VetRefreshTokenResponse,
  VetRegisterVerifyEmailResponse,
  VetCompleteOnboardingDto,
  VetCompleteClinicSetupDto,
  VetPendingClinicInvite,
} from '@petspond/types';
import type { ApiClient } from '@petspond/api-client';

const VET_AUTH_PREFIX = '/vet-auth';

export const vetAuthApi = {
  sendOtp(client: ApiClient, mobile: string, countryCode?: string) {
    return client.post<{ success: boolean; message?: string }>(
      `${VET_AUTH_PREFIX}/send-otp`,
      { mobile: mobile.replace(/\D/g, '').slice(-10), ...(countryCode && { countryCode }) },
    );
  },

  verifyOtp(client: ApiClient, mobile: string, otp: string) {
    return client.post<VetVerifyOtpResponse>(`${VET_AUTH_PREFIX}/verify-otp`, {
      mobile: mobile.replace(/\D/g, '').slice(-10),
      otp: otp.trim(),
    });
  },

  login(client: ApiClient, email: string, password: string) {
    return client.post<VetAuthResponse>(`${VET_AUTH_PREFIX}/login`, { email, password });
  },

  registerSendEmailOtp(client: ApiClient, email: string) {
    return client.post<{ success: boolean; message?: string }>(
      `${VET_AUTH_PREFIX}/register/send-email-otp`,
      { email },
    );
  },

  registerVerifyEmailOtp(client: ApiClient, email: string, otp: string) {
    return client.post<VetRegisterVerifyEmailResponse>(
      `${VET_AUTH_PREFIX}/register/verify-email-otp`,
      { email, otp },
    );
  },

  registerSetPassword(client: ApiClient, registrationToken: string, password: string) {
    return client.post<VetAuthResponse>(`${VET_AUTH_PREFIX}/register/set-password`, {
      registrationToken,
      password,
    });
  },

  googleAuth(client: ApiClient, idToken: string) {
    return client.post<VetAuthResponse>(`${VET_AUTH_PREFIX}/google`, { idToken });
  },

  refresh(client: ApiClient, refreshToken: string) {
    return client.post<VetRefreshTokenResponse>(`${VET_AUTH_PREFIX}/refresh`, { refreshToken });
  },

  logout(client: ApiClient, refreshToken: string) {
    return client.post<{ success: boolean }>(`${VET_AUTH_PREFIX}/logout`, { refreshToken });
  },

  logoutAll(client: ApiClient) {
    return client.post<{ success: boolean }>(`${VET_AUTH_PREFIX}/logout-all`, {});
  },

  onboardingSendPhoneOtp(client: ApiClient, mobile: string) {
    return client.post<{ success: boolean; message?: string }>(
      `${VET_AUTH_PREFIX}/onboarding/send-phone-otp`,
      { mobile: mobile.replace(/\D/g, '').slice(-10) },
    );
  },

  onboardingVerifyPhoneOtp(client: ApiClient, mobile: string, otp: string) {
    return client.post<Vet>(`${VET_AUTH_PREFIX}/onboarding/verify-phone-otp`, {
      mobile: mobile.replace(/\D/g, '').slice(-10),
      otp: otp.trim(),
    });
  },

  me(client: ApiClient) {
    return client.get<Vet>(`${VET_AUTH_PREFIX}/me`);
  },

  getPendingClinicInvite(client: ApiClient) {
    return client.get<VetPendingClinicInvite | null>(`${VET_AUTH_PREFIX}/pending-clinic-invite`);
  },

  acceptClinicInvite(client: ApiClient) {
    return client.post<Vet>(`${VET_AUTH_PREFIX}/accept-clinic-invite`, {});
  },

  completeOnboarding(client: ApiClient, data: VetCompleteOnboardingDto) {
    return client.post<Vet>(`${VET_AUTH_PREFIX}/complete-onboarding`, data);
  },

  completeClinicSetup(client: ApiClient, data: VetCompleteClinicSetupDto) {
    return client.post<{ vet: Vet; clinic: Clinic }>(`${VET_AUTH_PREFIX}/complete-clinic-setup`, data);
  },

  getTeam(client: ApiClient, clinicId: string) {
    return client.get<ClinicTeamResponse>(`${VET_AUTH_PREFIX}/clinic/${clinicId}/team`);
  },

  approveVet(client: ApiClient, vetId: string) {
    return client.patch<Vet>(`${VET_AUTH_PREFIX}/vets/${vetId}/approve`);
  },
};

export const clinicsApi = {
  list(client: ApiClient) {
    return client.get<Clinic[]>('/clinics');
  },
};
