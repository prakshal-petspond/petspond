import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts';
import { ProgressBar, ScreenHeader, PrimaryButton } from '@/components/ui';
import { LocationPermissionCard } from '../components';

const TOTAL_STEPS = 4;
const STEP = 3;

export interface LocationPermissionStepProps {
  onNext: () => void;
}

export function LocationPermissionStep({ onNext }: LocationPermissionStepProps) {
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <ProgressBar currentStep={STEP} totalSteps={TOTAL_STEPS} />
      <View style={styles.skipRow}>
        <View />
        <TouchableOpacity onPress={onNext} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.skipText, { color: t.colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>
      <ScreenHeader
        title="Enter Location"
        description="Allow location access to find vets near you. You can also enter your pincode on the next screen."
      />
      <LocationPermissionCard />
      <View style={styles.cta}>
        <PrimaryButton title="Proceed" onPress={onNext} />
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
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cta: {
    marginTop: 'auto',
  },
});
