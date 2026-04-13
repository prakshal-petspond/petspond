import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VaccineBookFlow } from '@/features/vaccination/VaccineBookFlow';

export default function VaccineBookScreen() {
  return (
    <View style={styles.fill}>
      <VaccineBookFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
