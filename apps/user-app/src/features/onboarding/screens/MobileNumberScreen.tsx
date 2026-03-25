import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, useOnboarding, useApi, getNetworkErrorHelp } from '@/contexts';
import { ProgressBar, ScreenHeader, TextInputField, PrimaryButton } from '@/components/ui';
import { authApi } from '@/services/auth.service';

const TOTAL_STEPS = 4;
const STEP = 1;

export interface MobileNumberStepProps {
  onNext: () => void;
}

export function MobileNumberStep({ onNext }: MobileNumberStepProps) {
  const t = useTheme();
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
      await authApi.sendOtp(client, trimmed);
      setMobile(trimmed);
      onNext();
    } catch (e: unknown) {
      const err = e as { message?: string; name?: string };
      const isNetworkError =
        err?.message === 'Network request failed' ||
        err?.message === 'Failed to fetch' ||
        err?.name === 'TypeError';
      const message = isNetworkError ? getNetworkErrorHelp() : (err?.message ?? 'Failed to send OTP. Try again.');
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
      <ProgressBar currentStep={STEP} totalSteps={TOTAL_STEPS} />
      <ScreenHeader
        title="Enter Mobile"
        description="We’ll send a one-time password to this number to verify it."
      />
      <TextInputField
        label="MOBILE NUMBER"
        placeholder="10-digit number"
        value={mobile}
        onChangeText={(v: string) => { setLocalMobile(v); setError(''); }}
        keyboardType="phone-pad"
        maxLength={14}
        error={error}
        editable={!loading}
      />
      <View style={styles.cta}>
        <PrimaryButton title="Proceed" onPress={proceed} loading={loading} disabled={loading} />
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
  cta: {
    marginTop: 'auto',
  },
});
