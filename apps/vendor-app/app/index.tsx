import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '@/contexts';
import { fetchVendorMe } from '@/services/vendorAuth';

export default function Index() {
  const router = useRouter();
  const { client, token } = useApi();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        if (!cancelled) router.replace('/login');
        setReady(true);
        return;
      }
      try {
        const vendor = await fetchVendorMe(client);
        if (cancelled) return;
        if (vendor.onboardingCompleted) router.replace('/(tabs)');
        else router.replace('/onboarding');
      } catch {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, token, router]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC6E2A" />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9EE' },
});
