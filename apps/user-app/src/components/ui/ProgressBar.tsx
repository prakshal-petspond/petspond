import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const t = useTheme();
  const progress = Math.min(1, Math.max(0, currentStep / totalSteps));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { backgroundColor: t.colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: t.colors.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: t.colors.muted }]}>
        Step {currentStep}/{totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
  },
});
