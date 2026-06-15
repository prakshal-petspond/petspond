/**
 * Shared API client for Petspond backend.
 * Use from vet-crm-web, user-app, vet-crm-mobile with a base URL from env.
 */

import type { ApiError } from '@petspond/types';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  refreshAccessToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
}

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  _retried?: boolean;
};

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, _retried, ...init } = options;
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
    if (res.status === 401 && !_retried && this.config.refreshAccessToken) {
      const newToken = await this.config.refreshAccessToken();
      if (newToken) {
        return this.request<T>(path, { ...options, _retried: true });
      }
    }
    if (res.status === 401 && this.config.onUnauthorized) {
      this.config.onUnauthorized();
    }
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }
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
