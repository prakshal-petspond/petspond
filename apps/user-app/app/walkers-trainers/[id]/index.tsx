import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WalkerTrainerDetailPage } from '@/features/walkers-trainers/WalkerTrainerDetailPage';

export default function WalkerTrainerDetailScreen() {
  return (
    <View style={styles.fill}>
      <WalkerTrainerDetailPage />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
