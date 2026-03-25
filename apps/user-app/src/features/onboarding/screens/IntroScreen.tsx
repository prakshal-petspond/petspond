import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';
import { PrimaryButton } from '@/components/ui';
import { FeatureCarousel } from '../components';

const INTRO_SLIDES = [
  { id: '1', description: 'Keep all your pets’ health records in one place.' },
  { id: '2', description: 'Find and book vets near you easily.' },
  { id: '3', description: 'Vaccination reminders and care tips.' },
];

export interface IntroStepProps {
  onNext: () => void;
}

export function IntroStep({ onNext }: IntroStepProps) {
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={[styles.graphics, { backgroundColor: t.colors.border }]} />
      <FeatureCarousel slides={INTRO_SLIDES} />
      <Text style={[styles.welcome, { color: t.colors.foreground }]}>Welcome to Petspond</Text>
      <Text style={[styles.welcomeDesc, { color: t.colors.muted }]}>
        One app for all your pet care needs. Let’s get you set up.
      </Text>
      <View style={styles.cta}>
        <PrimaryButton title="Let's get started" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  graphics: {
    height: 180,
    borderRadius: 12,
    marginBottom: 24,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  cta: {
    marginTop: 'auto',
  },
});
