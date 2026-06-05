import React, { createContext, useContext, useMemo, useCallback, useState, useEffect, type ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createApiClient, ApiClient } from '@petspond/api-client';

const TOKEN_KEY = 'petspond_vendor_token';
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const ApiContext = createContext<{
  client: ApiClient;
  token: string | null;
  setToken: (token: string | null) => void;
} | null>(null);

export function getNetworkErrorHelp(): string {
  return "Can't reach the server. Ensure the API is running and EXPO_PUBLIC_API_URL points to your machine.";
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((stored) => setTokenState(stored))
      .finally(() => setHydrated(true));
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) SecureStore.setItemAsync(TOKEN_KEY, t);
    else SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE,
        getAccessToken: () => token,
        onUnauthorized: () => setToken(null),
      }),
    [token, setToken],
  );

  const value = useMemo(() => ({ client, token, setToken }), [client, token, setToken]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FC6E2A" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9EE' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#676767' },
});

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}
