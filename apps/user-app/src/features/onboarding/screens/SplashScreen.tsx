import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';

export interface SplashStepProps {
  onNext: () => void;
}

export function SplashStep({ onNext }: SplashStepProps) {
  const t = useTheme();

  useEffect(() => {
    const id = setTimeout(onNext, 1500);
    return () => clearTimeout(id);
  }, [onNext]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <Text style={[styles.title, { color: t.colors.foreground }]}>Petspond</Text>
      <Text style={[styles.subtitle, { color: t.colors.muted }]}>Loading…</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
});
