/**
 * Shared API client for Petspond backend.
 * Use from vet-crm-web, user-app, vet-crm-mobile with a base URL from env.
 */

import type { ApiError } from '@petspond/types';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  private async request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, string> } = {},
  ): Promise<T> {
    const { params, ...init } = options;
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };
    const token = this.config.getAccessToken?.();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url.toString(), { ...init, headers });
    if (res.status === 401 && this.config.onUnauthorized) {
      this.config.onUnauthorized();
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: ApiError = {
        statusCode: res.status,
        message: (data as { message?: string }).message ?? res.statusText,
        error: (data as { error?: string }).error,
      };
      throw err;
    }
    return data as T;
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
