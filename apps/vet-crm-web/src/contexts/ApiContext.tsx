'use client';

import React, { createContext, useContext, useMemo, useCallback, useState, type ReactNode } from 'react';
import { createApiClient, ApiClient } from '@petspond/api-client';

const ApiContext = createContext<{ client: ApiClient; setToken: (token: string | null) => void } | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  const client = useMemo(() => {
    return createApiClient({
      baseUrl: API_BASE,
      getAccessToken: () => token,
      onUnauthorized: () => setTokenState(null),
    });
  }, [token]);

  const setToken = useCallback((t: string | null) => setTokenState(t), []);

  const value = useMemo(() => ({ client, setToken }), [client, setToken]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}
