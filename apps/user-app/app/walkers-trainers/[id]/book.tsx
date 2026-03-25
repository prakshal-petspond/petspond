import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WalkerBookingFlow } from '@/features/walkers-trainers/WalkerBookingFlow';

export default function WalkerBookingScreen() {
  return (
    <View style={styles.fill}>
      <WalkerBookingFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
