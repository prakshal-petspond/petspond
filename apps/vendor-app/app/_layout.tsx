import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Providers } from '@/app/providers';

export default function RootLayout() {
  return (
    <Providers>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </Providers>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
