import { useCallback, useEffect, useState } from 'react';
import type { VendorServiceType } from '@petspond/types';
import { useApi } from '@/contexts';
import { fetchPublicVendors } from '@/services/vendors';

export function usePublicVendors(
  type: VendorServiceType | undefined,
  coords: { latitude: number; longitude: number } | null,
) {
  const { client } = useApi();
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchPublicVendors>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!coords) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPublicVendors(client, {
        type,
        lat: coords.latitude,
        lng: coords.longitude,
      });
      setItems(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [client, coords, type]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
