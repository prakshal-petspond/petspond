'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { createApiClient, ApiClient } from '@petspond/api-client';

const TOKEN_KEY = 'vet-crm-token';

const ApiContext = createContext<{
  client: ApiClient;
  token: string | null;
  setToken: (token: string | null) => void;
} | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setTokenState(localStorage.getItem(TOKEN_KEY));
    setHydrated(true);
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (typeof window === 'undefined') return;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}
