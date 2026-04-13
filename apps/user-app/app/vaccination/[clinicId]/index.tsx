import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VaccinationClinicDetailPage } from '@/features/vaccination/VaccinationClinicDetailPage';

export default function VaccinationClinicScreen() {
  return (
    <View style={styles.fill}>
      <VaccinationClinicDetailPage />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
