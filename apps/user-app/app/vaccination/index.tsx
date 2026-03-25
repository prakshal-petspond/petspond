import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VaccinationPage } from '@/features/vaccination/VaccinationPage';

export default function VaccinationScreen() {
  return (
    <View style={styles.fill}>
      <VaccinationPage />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
