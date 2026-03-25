import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/contexts';
import { useOnboarding } from '@/contexts';
import { ProgressBar, ScreenHeader, TextInputField, PrimaryButton } from '@/components/ui';

const TOTAL_STEPS = 4;
const STEP = 3;

export interface PincodeStepProps {
  onNext: () => void;
}

export function PincodeStep({ onNext }: PincodeStepProps) {
  const t = useTheme();
  const { state, setPincode } = useOnboarding();
  const [pincode, setLocalPincode] = useState(state.pincode);
  const [error, setError] = useState('');

  const proceed = () => {
    const trimmed = pincode.trim().replace(/\D/g, '');
    if (trimmed.length !== 6) {
      setError('Enter a valid 6-digit pincode');
      return;
    }
    setError('');
    setPincode(trimmed);
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
        title="Enter Pincode"
        description="We’ll use this to show vets and services in your area."
      />
      <TextInputField
        label="PINCODE"
        placeholder="6-digit pincode"
        value={pincode}
        onChangeText={(v) => { setLocalPincode(v); setError(''); }}
        keyboardType="number-pad"
        maxLength={6}
        error={error}
      />
      <View style={styles.cta}>
        <PrimaryButton title="Proceed" onPress={proceed} disabled={pincode.replace(/\D/g, '').length !== 6} />
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
