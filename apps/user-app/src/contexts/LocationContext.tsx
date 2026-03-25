import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as Location from 'expo-location';

export type LocationState = {
  /** Readable address line (e.g. "123 Main St, City, Region") */
  addressLine: string | null;
  /** Coords if available */
  coords: { latitude: number; longitude: number } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const LocationContext = createContext<LocationState | null>(null);

const FALLBACK_ADDRESS = 'Your location';

/** Detect range-style street number (e.g. "1-99") from reverse geocode - often inaccurate */
function isRangeStyleStreetNumber(streetNumber: string | null): boolean {
  if (!streetNumber || !streetNumber.trim()) return false;
  return /^\d+\s*-\s*\d+$/.test(streetNumber.trim());
}

function formatAddressFromParts(addr: Location.LocationGeocodedAddress): string {
  const streetPart = [addr.streetNumber, addr.street].filter(Boolean).join(' ').trim();
  const isRange = isRangeStyleStreetNumber(addr.streetNumber);
  const city = addr.city ?? addr.subregion ?? addr.region;
  const region = addr.region ?? addr.subregion;

  if (addr.formattedAddress && addr.formattedAddress.trim()) {
    const formatted = addr.formattedAddress.trim();
    if (!isRange || !streetPart) return formatted;
    const withoutRange = [addr.street, city, region].filter(Boolean).join(', ');
    return withoutRange || formatted;
  }
  const parts = isRange && addr.street
    ? [addr.street, city, region, addr.postalCode, addr.country]
    : [streetPart, city, region, addr.postalCode, addr.country];
  const joined = parts.filter(Boolean).join(', ');
  return joined || FALLBACK_ADDRESS;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [addressLine, setAddressLine] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setAddressLine(FALLBACK_ADDRESS);
        setLoading(false);
        return;
      }

      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        setError('Location services are off');
        setAddressLine(FALLBACK_ADDRESS);
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addresses.length > 0) {
          const best = addresses.find((a) => !isRangeStyleStreetNumber(a.streetNumber)) ?? addresses[0];
          setAddressLine(formatAddressFromParts(best));
        } else {
          setAddressLine(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (geocodeErr) {
        setAddressLine(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      setAddressLine(FALLBACK_ADDRESS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const value: LocationState = {
    addressLine,
    coords,
    loading,
    error,
    refresh: fetchLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return ctx;
}
