import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FindVetPage } from '@/features/find-vet/FindVetPage';

export default function FindVetScreen() {
  return (
    <View style={styles.fill}>
      <FindVetPage />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
