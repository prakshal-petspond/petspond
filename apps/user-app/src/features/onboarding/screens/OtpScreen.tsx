import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useOnboarding, useApi } from '@/contexts';
import { ProgressBar, ScreenHeader, OtpInput, PrimaryButton } from '@/components/ui';
import { authApi } from '@/services/auth.service';

const TOTAL_STEPS = 4;
const STEP = 1;
const OTP_DIGITS = 6;

export interface OtpStepProps {
  onNext: () => void;
}

export function OtpStep({ onNext }: OtpStepProps) {
  const t = useTheme();
  const router = useRouter();
  const { client, setToken } = useApi();
  const { state, setOtp } = useOnboarding();
  const [otp, setLocalOtp] = useState(state.otp);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const proceed = async () => {
    if (otp.length !== OTP_DIGITS) {
      setError(`Enter the ${OTP_DIGITS}-digit code`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(client, state.mobile, otp);
      if (!res.verified) {
        setError(res.message ?? 'Invalid or expired OTP.');
        return;
      }
      if (res.token) setToken(res.token);
      setOtp(otp);
      if (res.user?.onboardingCompleted) {
        router.replace('/');
      } else {
        onNext();
      }
    } catch (e: unknown) {
      const message = (e as { message?: string })?.message ?? 'Verification failed. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!state.mobile || resendLoading) return;
    setError('');
    setResendLoading(true);
    try {
      await authApi.sendOtp(client, state.mobile);
      setError('');
    } catch (e: unknown) {
      const message = (e as { message?: string })?.message ?? 'Failed to resend OTP.';
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}
    >
      <ProgressBar currentStep={STEP} totalSteps={TOTAL_STEPS} />
      <ScreenHeader
        title="Enter OTP"
        description="We’ve sent a one-time password to your mobile number. Enter it below."
      />
      <Text style={[styles.hint, { color: t.colors.muted }]}>
        Didn't get the code? If the API is in mock mode, check the API server console for the OTP.
      </Text>
      <OtpInput
        digitCount={OTP_DIGITS}
        value={otp}
        onChangeValue={(v) => { setLocalOtp(v); setError(''); }}
        onComplete={setLocalOtp}
      />
      <TouchableOpacity onPress={resendOtp} disabled={resendLoading} style={styles.resend}>
        <Text style={[styles.resendText, { color: t.colors.primary }]}>
          {resendLoading ? 'Sending…' : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
      {error ? (
        <Text style={[styles.errorText, { color: t.colors.error }]}>{error}</Text>
      ) : null}
      <View style={styles.cta}>
        <PrimaryButton
          title="Proceed"
          onPress={proceed}
          disabled={otp.length !== OTP_DIGITS || loading}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  hint: {
    fontSize: 12,
    marginBottom: 12,
  },
  resend: { alignSelf: 'flex-start', marginBottom: 8 },
  resendText: { fontSize: 14 },
  errorText: { fontSize: 12, marginBottom: 12 },
  cta: {
    marginTop: 'auto',
  },
});
