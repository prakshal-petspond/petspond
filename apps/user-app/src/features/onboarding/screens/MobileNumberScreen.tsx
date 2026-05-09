import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useOnboarding, useApi, getNetworkErrorHelp } from '@/contexts';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { ScreenHeader, PrimaryButton } from '@/components/ui';
import { authApi } from '@/services/auth.service';

const TOTAL_STEPS = 5;
const STEP = 1;

export type MobileNumberScreenProps = {
  onNext: () => void;
  onBack: () => void;
};

export function MobileNumberScreen({ onNext, onBack }: MobileNumberScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { client } = useApi();
  const { state, setMobile } = useOnboarding();
  const [mobile, setLocalMobile] = useState(state.mobile);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const proceed = async () => {
    const trimmed = mobile.trim().replace(/\D/g, '');
    if (trimmed.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(client, trimmed, { countryCode: '91' });
      setMobile(trimmed);
      onNext();
    } catch (e: unknown) {
      const err = e as { message?: string; name?: string };
      const isNetworkError =
        err?.message === 'Network request failed' ||
        err?.message === 'Failed to fetch' ||
        err?.name === 'TypeError';
      const message = isNetworkError
        ? getNetworkErrorHelp()
        : (err?.message ?? 'Failed to send OTP. Try again.');
      setError(message);
    } finally {
      setLoading(false);
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
          title="Enter Mobile"
          description="We'll send you a verification code to confirm your number"
        />
        <View style={[styles.phoneRow, { borderColor: 'white', backgroundColor: t.colors.slate }]}>
          <Text style={[styles.prefix, { color: t.colors.muted }]}>+91</Text>
          <TextInput
            style={[styles.phoneInput, { color: t.colors.foreground }]}
            placeholder="Mobile Number"
            placeholderTextColor={t.colors.muted}
            value={mobile}
            onChangeText={(v: string) => {
              setLocalMobile(v);
              setError('');
            }}
            keyboardType="phone-pad"
            maxLength={14}
            editable={!loading}
          />
        </View>
        {error ? <Text style={[styles.errorText, { color: t.colors.error }]}>{error}</Text> : null}
        <View style={styles.cta}>
          <PrimaryButton
            tone="accent"
            title="Proceed ›"
            onPress={proceed}
            loading={loading}
            disabled={loading}
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
    flexGrow: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    paddingVertical: 14,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  cta: {
    marginTop: 'auto',
  },
});
