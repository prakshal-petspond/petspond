import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useOnboarding } from '@/contexts';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { ScreenHeader, TextInputField, PrimaryButton, SecondaryButton } from '@/components/ui';

const TOTAL_STEPS = 5;
const STEP = 4;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailScreenProps = {
  onNext: () => void;
  onBack: () => void;
};

export function EmailScreen({ onNext, onBack }: EmailScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
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
    onNext();
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
          title="Enter Email"
          description="Get booking confirmations and updates (Optional)"
        />
        <TextInputField
          placeholder="your@email.com"
          value={email}
          onChangeText={(v: string) => {
            setLocalEmail(v);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <View style={styles.actions}>
          <View style={styles.skipWrap}>
            <SecondaryButton title="Skip" onPress={skip} />
          </View>
          <View style={styles.proceedWrap}>
            <PrimaryButton tone="accent" title="Proceed ›" onPress={proceed} />
          </View>
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  skipWrap: { flex: 0.35 },
  proceedWrap: { flex: 0.65 },
});
