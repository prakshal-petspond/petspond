import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useOnboarding } from '@/contexts';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { ScreenHeader, TextInputField, PrimaryButton } from '@/components/ui';

const TOTAL_STEPS = 5;
const STEP = 3;

export type NameScreenProps = {
  onNext: () => void;
  onBack: () => void;
};

export function NameScreen({ onNext, onBack }: NameScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, setName } = useOnboarding();
  const [name, setLocalName] = useState(state.name);
  const [error, setError] = useState('');

  const proceed = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setName(trimmed);
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
          title="Enter Name"
          description="Help us personalize your experience"
        />
        <TextInputField
          placeholder="Your Name"
          value={name}
          onChangeText={(v: string) => {
            setLocalName(v);
            setError('');
          }}
          autoCapitalize="words"
          error={error}
        />
        <View style={styles.cta}>
          <PrimaryButton tone="accent" title="Proceed ›" onPress={proceed} />
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
  cta: {
    marginTop: 'auto',
  },
});
