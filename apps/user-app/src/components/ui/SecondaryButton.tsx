import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';

export interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function SecondaryButton({ title, onPress, disabled }: SecondaryButtonProps) {
  const t = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: t.colors.inactive_bg_alpha,
          borderRadius: t.borderRadius.lg,
        },
      ]}
    >
      <Text style={[styles.label, { color: t.colors.text_primary }]}>{title}</Text>
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
    fontSize: 16,
    fontWeight: '600',
  },
});
