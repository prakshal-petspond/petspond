import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';

export interface ScreenHeaderProps {
  title: string;
  description?: string;
}

export function ScreenHeader({ title, description }: ScreenHeaderProps) {
  const t = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: t.colors.text_dark_grey }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: t.colors.text_grey }]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 48,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
});
