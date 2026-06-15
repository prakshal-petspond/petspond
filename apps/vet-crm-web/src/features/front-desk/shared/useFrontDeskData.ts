'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiClient } from '@petspond/api-client';
import { useApi } from '@/contexts';

export function useFrontDeskData<T>(
  loader: (client: ApiClient) => Promise<T>,
  deps: unknown[] = [],
) {
  const { client } = useApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const result = await loader(client);
      setData(result);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, loader, ...deps]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
