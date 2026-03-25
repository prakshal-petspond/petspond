import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/contexts';
import { useOnboarding } from '@/contexts';
import { ProgressBar, ScreenHeader, TextInputField, PrimaryButton, SecondaryButton } from '@/components/ui';

const TOTAL_STEPS = 4;
const STEP = 3;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailStepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function EmailStep({ onNext, onSkip }: EmailStepProps) {
  const t = useTheme();
  const { state, setEmail } = useOnboarding();
  const [email, setLocalEmail] = useState(state.email);
  const [error, setError] = useState('');

  const proceed = () => {
    const trimmed = email.trim();
    if (trimmed && !EMAIL_REGEX.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setEmail(trimmed);
    onNext();
  };

  const skip = () => {
    setEmail('');
    onSkip?.();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}
    >
      <ProgressBar currentStep={STEP} totalSteps={TOTAL_STEPS} />
      <ScreenHeader
        title="Enter Email"
        description="Optional but recommended for reminders and receipts."
      />
      <TextInputField
        label="EMAIL ID"
        placeholder="your@email.com"
        value={email}
        onChangeText={(v) => { setLocalEmail(v); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={error}
      />
      <View style={styles.actions}>
        <View style={styles.skipWrap}>
          <SecondaryButton title="Skip" onPress={skip} />
        </View>
        <View style={styles.proceedWrap}>
          <PrimaryButton title="Proceed" onPress={proceed} />
        </View>
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  skipWrap: { flex: 0.35 },
  proceedWrap: { flex: 0.65 },
});
