import type {
  SendOtpResponse,
  VerifyOtpResponse,
  User,
  CompleteOnboardingDto,
} from '@petspond/types';
import type { ApiClient } from '@petspond/api-client';

export const authApi = {
  sendOtp(
    client: ApiClient,
    mobile: string,
    options?: { countryCode?: string },
  ): Promise<SendOtpResponse> {
    const body: { mobile: string; countryCode?: string } = {
      mobile: mobile.replace(/\D/g, '').slice(-10),
    };
    if (options?.countryCode) body.countryCode = options.countryCode;
    return client.post<SendOtpResponse>('/auth/send-otp', body);
  },

  verifyOtp(
    client: ApiClient,
    mobile: string,
    otp: string,
  ): Promise<VerifyOtpResponse> {
    return client.post<VerifyOtpResponse>('/auth/verify-otp', {
      mobile: mobile.replace(/\D/g, '').slice(-10),
      otp: otp.trim(),
    });
  },

  me(client: ApiClient): Promise<User> {
    return client.get<User>('/auth/me');
  },

  completeOnboarding(
    client: ApiClient,
    data: CompleteOnboardingDto,
  ): Promise<User> {
    return client.post<User>('/auth/complete-onboarding', data);
  },
};
