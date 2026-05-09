import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useOnboarding, useApi } from '@/contexts';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { ScreenHeader, OtpInput, PrimaryButton } from '@/components/ui';
import { authApi } from '@/services/auth.service';

const TOTAL_STEPS = 5;
const STEP = 2;
const OTP_DIGITS = 6;

export type OtpScreenProps = {
  onNext: () => void;
  onBack: () => void;
};

export function OtpScreen({ onNext, onBack }: OtpScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
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
      await authApi.sendOtp(client, state.mobile, { countryCode: 'IN' });
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
      <View style={[styles.inner, { paddingBottom: insets.bottom + 16 }]}>
        <OnboardingStepHeader currentStep={STEP} totalSteps={TOTAL_STEPS} onBack={onBack} />
        <ScreenHeader
          title="Enter OTP"
          description="We've sent a verification code to your mobile number"
        />
        <OtpInput
          digitCount={OTP_DIGITS}
          value={otp}
          onChangeValue={(v) => {
            setLocalOtp(v);
            setError('');
          }}
          onComplete={setLocalOtp}
        />
        <View style={styles.resendRow}>
          <Text style={[styles.resendLine, { color: t.colors.muted }]}>
            Did not receive the code?{' '}
          </Text>
          <Pressable onPress={resendOtp} disabled={resendLoading} hitSlop={8}>
            <Text style={[styles.resendAction, { color: t.colors.accent }]}>
              {resendLoading ? 'Sending…' : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>
        {error ? <Text style={[styles.errorText, { color: t.colors.error }]}>{error}</Text> : null}
        <View style={styles.cta}>
          <PrimaryButton
            tone="accent"
            title="Proceed ›"
            onPress={proceed}
            disabled={otp.length !== OTP_DIGITS || loading}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  resendRow: {
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  resendAction: {
    fontWeight: '700',
    marginTop: 20,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  cta: {
    marginTop: 'auto',
  },
});
