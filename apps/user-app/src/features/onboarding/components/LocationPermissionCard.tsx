import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { useTheme } from '@/contexts';
import { PrimaryButton } from '@/components/ui';

export interface LocationPermissionCardProps {
  onOpenSettings?: () => void;
}

export function LocationPermissionCard({ onOpenSettings }: LocationPermissionCardProps) {
  const t = useTheme();

  const openSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: t.colors.border }]}>
      <Text style={[styles.text, { color: t.colors.foreground }]}>
        Enable location services to find vets near you and get relevant recommendations.
      </Text>
      <PrimaryButton title="Open settings" onPress={openSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});
