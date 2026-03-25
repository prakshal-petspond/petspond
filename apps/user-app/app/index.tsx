import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import type { User } from '@petspond/types';
import { authApi } from '@/services/auth.service';
import { LandingPage } from '@/features/home/LandingPage';

export default function HomeScreen() {
  const t = useTheme();
  const { client, token, setToken } = useApi();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .me(client)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, client, setToken]);

  if (!token) {
    return <Redirect href="/onboarding" />;
  }

  if (user === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/onboarding" />;
  }

  if (!user.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.centered}>
      <LandingPage />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1 },
});
