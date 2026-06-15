'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createApiClient, ApiClient } from '@petspond/api-client';
import type { VetRefreshTokenResponse } from '@petspond/types';

const ACCESS_TOKEN_KEY = 'vet-crm-token';
const REFRESH_TOKEN_KEY = 'vet-crm-refresh-token';

/** Sync read for auth guards when React state has not flushed yet after login. */
export function getStoredVetToken(): string | null {
  return getStoredVetAccessToken();
}

export function getStoredVetAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredVetRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

const ApiContext = createContext<{
  client: ApiClient;
  token: string | null;
  setToken: (token: string | null) => void;
  setAuthTokens: (accessToken: string | null, refreshToken?: string | null) => void;
  clearAuth: () => void;
} | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setTokenState(localStorage.getItem(ACCESS_TOKEN_KEY));
    setHydrated(true);
  }, []);

  const clearAuth = useCallback(() => {
    setTokenState(null);
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const setAuthTokens = useCallback((accessToken: string | null, refreshToken?: string | null) => {
    setTokenState(accessToken);
    if (typeof window === 'undefined') return;
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);

    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      else localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }, []);

  const setToken = useCallback(
    (accessToken: string | null) => {
      setAuthTokens(accessToken);
    },
    [setAuthTokens],
  );

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const run = async () => {
      const storedRefresh = getStoredVetRefreshToken();
      if (!storedRefresh) return null;

      try {
        const res = await fetch(`${API_BASE}/vet-auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as VetRefreshTokenResponse;
        setAuthTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      } catch {
        return null;
      }
    };

    refreshPromiseRef.current = run().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }, [setAuthTokens]);

  const client = useMemo(() => {
    return createApiClient({
      baseUrl: API_BASE,
      getAccessToken: () => token ?? getStoredVetAccessToken(),
      refreshAccessToken,
      onUnauthorized: clearAuth,
    });
  }, [token, refreshAccessToken, clearAuth]);

  const value = useMemo(
    () => ({ client, token, setToken, setAuthTokens, clearAuth }),
    [client, token, setToken, setAuthTokens, clearAuth],
  );

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
