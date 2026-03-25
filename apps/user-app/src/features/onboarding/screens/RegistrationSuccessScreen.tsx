import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';
import { PrimaryButton } from '@/components/ui';

export interface RegistrationSuccessStepProps {
  onComplete: () => void;
  completing?: boolean;
}

export function RegistrationSuccessStep({ onComplete, completing }: RegistrationSuccessStepProps) {
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <Text style={[styles.title, { color: t.colors.primary }]}>Purr-fect!</Text>
      <Text style={[styles.message, { color: t.colors.muted }]}>
        You’re all set. We’ve created your account. Add your first pet to get started.
      </Text>
      <View style={styles.cta}>
        <PrimaryButton title="Go to home" onPress={onComplete} loading={completing} disabled={completing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  cta: {
    width: '100%',
    maxWidth: 280,
  },
});
