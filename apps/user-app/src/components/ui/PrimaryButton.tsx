import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Use theme accent (orange) instead of primary blue — common for onboarding CTAs. */
  tone?: 'primary' | 'accent';
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  tone = 'primary',
}: PrimaryButtonProps) {
  const t = useTheme();
  const accentColor = tone === 'accent' ? t.colors.accent : t.colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: disabled || loading ? t.colors.border : accentColor,
          borderRadius: t.borderRadius.full,
        },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
