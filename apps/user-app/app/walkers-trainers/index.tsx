import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WalkersTrainersPage } from '@/features/walkers-trainers/WalkersTrainersPage';

export default function WalkersTrainersScreen() {
  return (
    <View style={styles.fill}>
      <WalkersTrainersPage />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
