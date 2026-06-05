import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'accent';
};

export function PrimaryButton({ title, onPress, loading, disabled, tone = 'accent' }: Props) {
  const t = useTheme();
  const bg = tone === 'accent' ? t.colors.accent : t.colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: disabled || loading ? t.colors.inactive_bg_alpha : bg,
          borderRadius: t.borderRadius.full,
        },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
