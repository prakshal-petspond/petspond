import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VetDetailPage } from '@/features/find-vet/VetDetailPage';

export default function VetDetailScreen() {
  return (
    <View style={styles.fill}>
      <VetDetailPage />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
