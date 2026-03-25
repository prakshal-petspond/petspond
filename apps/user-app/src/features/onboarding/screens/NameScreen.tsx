import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/contexts';
import { useOnboarding } from '@/contexts';
import { ProgressBar, ScreenHeader, TextInputField, PrimaryButton } from '@/components/ui';

const TOTAL_STEPS = 4;
const STEP = 2;

export interface NameStepProps {
  onNext: () => void;
}

export function NameStep({ onNext }: NameStepProps) {
  const t = useTheme();
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
      <ProgressBar currentStep={STEP} totalSteps={TOTAL_STEPS} />
      <ScreenHeader
        title="Enter Name"
        description="What should we call you?"
      />
      <TextInputField
        label="USERNAME"
        placeholder="Your name"
        value={name}
        onChangeText={(v) => { setLocalName(v); setError(''); }}
        autoCapitalize="words"
        error={error}
      />
      <View style={styles.cta}>
        <PrimaryButton title="Proceed" onPress={proceed} />
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
