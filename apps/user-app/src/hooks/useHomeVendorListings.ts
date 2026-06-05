import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/contexts';
import type { ServiceListingItem } from '@/features/home/types';
import { vendorToServiceCard } from '@/lib/vendorMappers';
import { fetchPublicVendors } from '@/services/vendors';

export function useHomeVendorListings(coords: { latitude: number; longitude: number } | null) {
  const { client } = useApi();
  const [walkers, setWalkers] = useState<ServiceListingItem[]>([]);
  const [groomers, setGroomers] = useState<ServiceListingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coords) {
      setWalkers([]);
      setGroomers([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchPublicVendors(client, {
        lat: coords.latitude,
        lng: coords.longitude,
      });
      setWalkers(
        list
          .filter((v) => v.serviceTypes.includes('walking') || v.serviceTypes.includes('training'))
          .map(vendorToServiceCard),
      );
      setGroomers(list.filter((v) => v.serviceTypes.includes('grooming')).map(vendorToServiceCard));
    } catch {
      setWalkers([]);
      setGroomers([]);
    } finally {
      setLoading(false);
    }
  }, [client, coords]);

  useEffect(() => {
    load();
  }, [load]);

  return { walkers, groomers, loading, reload: load };
}
