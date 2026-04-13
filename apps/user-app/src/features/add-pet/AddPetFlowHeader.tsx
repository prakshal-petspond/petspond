import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const GRADIENT = ['#fb923c', '#ea580c'] as const;

type Props = {
  step: number;
  totalSteps: number;
  onBack: () => void;
  paddingTop: number;
};

export function AddPetFlowHeader({ step, totalSteps, onBack, paddingTop }: Props) {
  return (
    <LinearGradient colors={[...GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradient, { paddingTop }]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backHit} onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Add New Pet</Text>
        <View style={styles.backHit} />
      </View>
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressSeg,
              i < step ? styles.progressSegActive : styles.progressSegInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Step {step} of {totalSteps}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegActive: {
    backgroundColor: '#fff',
  },
  progressSegInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stepLabel: {
    marginTop: 12,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
});
