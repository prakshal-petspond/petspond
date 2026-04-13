import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BookVetFlow } from '@/features/find-vet/BookVetFlow';

export default function BookVetScreen() {
  return (
    <View style={styles.fill}>
      <BookVetFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
