import React, { createContext, useContext, useMemo, useCallback, useState, useEffect, type ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createApiClient, ApiClient } from '@petspond/api-client';

const TOKEN_KEY = 'petspond_token';

const ApiContext = createContext<{
  client: ApiClient;
  token: string | null;
  setToken: (token: string | null) => void;
} | null>(null);

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** User-friendly message when the app can't reach the API (e.g. wrong URL on device). */
export function getNetworkErrorHelp(): string {
  return "Can't reach the server. (1) Ensure the API is running: pnpm --filter @petspond/api dev. (2) On a physical device: set EXPO_PUBLIC_API_URL in apps/user-app/.env to your computer's IP (e.g. http://192.168.1.8:3000), use the same WiFi as your phone, then restart Expo (npx expo start --clear).";
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setHydrated(true);
    }, 500);
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((stored) => {
        if (!cancelled) {
          setTokenState(stored);
          setHydrated(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) SecureStore.setItemAsync(TOKEN_KEY, t);
    else SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  const client = useMemo(() => {
    return createApiClient({
      baseUrl: API_BASE,
      getAccessToken: () => token,
      onUnauthorized: () => setToken(null),
    });
  }, [token, setToken]);

  const value = useMemo(() => ({ client, token, setToken }), [client, token, setToken]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
});

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}