'use client';

import React, { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 };

export type ClinicLocationResolved = {
  latitude: number;
  longitude: number;
  placeId?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  formattedAddress?: string,
): Pick<ClinicLocationResolved, 'address' | 'city' | 'state' | 'pincode'> {
  if (!components?.length) {
    return formattedAddress ? { address: formattedAddress } : {};
  }
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name;
  const streetNumber = get('street_number');
  const route = get('route');
  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim();
  const sublocality = get('sublocality') ?? get('sublocality_level_1');
  const locality = get('locality') ?? get('administrative_area_level_2');
  const state = get('administrative_area_level_1');
  const pincode = get('postal_code');
  const address =
    formattedAddress ||
    [line1, sublocality].filter(Boolean).join(', ') ||
    [line1, locality].filter(Boolean).join(', ') ||
    undefined;
  return {
    ...(address && { address }),
    ...(locality && { city: locality }),
    ...(state && { state }),
    ...(pincode && { pincode }),
  };
}

type InnerProps = {
  apiKey: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationResolved: (p: ClinicLocationResolved) => void;
  showSearch: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  searchClassName?: string;
  searchPlaceholder?: string;
  hideSearchLabel?: boolean;
  hideSearchHint?: boolean;
};

function ClinicLocationMapInner({
  apiKey,
  initialLat,
  initialLng,
  onLocationResolved,
  showSearch,
  searchInputRef,
  searchClassName,
  searchPlaceholder,
  hideSearchLabel,
  hideSearchHint,
}: InnerProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? internalInputRef;
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const onLocationRef = useRef(onLocationResolved);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const usesExternalInput = Boolean(searchInputRef);

  useEffect(() => {
    onLocationRef.current = onLocationResolved;
  }, [onLocationResolved]);

  useEffect(() => {
    const el = mapDivRef.current;
    if (!el) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const initMap = () => {
      const input = inputRef.current;
      if (!input || !mapDivRef.current) return false;

      setOptions({ key: apiKey, v: 'weekly' });

      Promise.all([importLibrary('maps'), importLibrary('places')])
        .then(() => {
          if (cancelled || !mapDivRef.current || !inputRef.current) return;

          const center = DEFAULT_CENTER;

          const map = new google.maps.Map(mapDivRef.current, {
            center,
            zoom: 12,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          });
          mapRef.current = map;

          const marker = new google.maps.Marker({
            map,
            position: center,
            draggable: true,
          });
          markerRef.current = marker;

          const ac = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['place_id', 'geometry', 'formatted_address', 'address_components'],
          });
          acRef.current = ac;

          const onPlaceChanged = () => {
            const place = ac.getPlace();
            const loc = place.geometry?.location;
            if (!loc) return;
            const lat = loc.lat();
            const lng = loc.lng();
            marker.setPosition({ lat, lng });
            map.panTo({ lat, lng });
            map.setZoom(16);
            const parsed = parseAddressComponents(place.address_components, place.formatted_address);
            onLocationRef.current({
              latitude: lat,
              longitude: lng,
              placeId: place.place_id,
              ...parsed,
            });
          };

          const onDragEnd = () => {
            const pos = marker.getPosition();
            if (!pos) return;
            onLocationRef.current({ latitude: pos.lat(), longitude: pos.lng(), placeId: '' });
          };

          listenersRef.current.push(ac.addListener('place_changed', onPlaceChanged));
          listenersRef.current.push(marker.addListener('dragend', onDragEnd));

          setLoaded(true);
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setLoadError(e instanceof Error ? e.message : 'Failed to load Google Maps');
          }
        });

      return true;
    };

    if (!initMap() && usesExternalInput) {
      retryTimer = setTimeout(() => {
        if (!cancelled) initMap();
      }, 0);
    }

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      listenersRef.current.forEach((l) => {
        l.remove();
      });
      listenersRef.current = [];
      markerRef.current?.setMap(null);
      markerRef.current = null;
      acRef.current = null;
      mapRef.current = null;
      setLoaded(false);
    };
  }, [apiKey, inputRef, usesExternalInput]);

  useEffect(() => {
    if (!loaded || !markerRef.current || !mapRef.current) return;
    if (
      initialLat == null ||
      initialLng == null ||
      !Number.isFinite(initialLat) ||
      !Number.isFinite(initialLng)
    ) {
      return;
    }
    const pos = { lat: initialLat, lng: initialLng };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(16);
  }, [loaded, initialLat, initialLng]);

  if (loadError) {
    return (
      <div className="rounded-lg border border-error/40 bg-error/5 p-4 text-sm text-error">
        Could not load Google Maps ({loadError}). Check your API key and enable Maps JavaScript API + Places API in
        Google Cloud.
      </div>
    );
  }

  const defaultSearchClass =
    'w-full border border-border rounded-lg px-3 py-2.5 bg-background text-foreground text-sm';

  return (
    <div className="space-y-3">
      {showSearch && !usesExternalInput ? (
        <div>
          {!hideSearchLabel ? (
            <label className="block text-sm text-muted mb-1">Search clinic address</label>
          ) : null}
          <input
            ref={internalInputRef}
            type="text"
            placeholder={searchPlaceholder ?? 'Start typing your clinic name or address…'}
            className={searchClassName ?? defaultSearchClass}
            autoComplete="off"
          />
          {!hideSearchHint ? (
            <p className="text-xs text-muted mt-1.5">
              Pick a result to place the pin. Drag the marker to fine-tune. Coordinates are saved when you click Save
              (not shown here).
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-border bg-muted/30">
        <div ref={mapDivRef} className="absolute inset-0" />
        {!loaded && !loadError && (
          <div className="absolute inset-0 bg-muted/50 animate-pulse pointer-events-none z-[1]" aria-hidden />
        )}
      </div>
    </div>
  );
}

type ClinicLocationPickerProps = {
  apiKey: string | undefined;
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationResolved: (p: ClinicLocationResolved) => void;
  /** When false, only the map is shown unless `searchInputRef` is provided. */
  showSearch?: boolean;
  /** Bind Places Autocomplete to an external input (e.g. onboarding styled field). */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  searchClassName?: string;
  searchPlaceholder?: string;
  hideSearchLabel?: boolean;
  hideSearchHint?: boolean;
};

export function ClinicLocationPicker({
  apiKey,
  initialLat,
  initialLng,
  onLocationResolved,
  showSearch = true,
  searchInputRef,
  searchClassName,
  searchPlaceholder,
  hideSearchLabel,
  hideSearchHint,
}: ClinicLocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-[340px] rounded-lg bg-muted/40 animate-pulse" aria-hidden />;
  }

  const key = apiKey?.trim();
  if (!key) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted space-y-2">
        <p className="font-medium text-foreground">Map search unavailable</p>
        <p>
          Set <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">apps/vet-crm-web/.env.local</code>. Enable{' '}
          <strong className="text-foreground">Maps JavaScript API</strong> and{' '}
          <strong className="text-foreground">Places API</strong> for your key. Until then, coordinates are not captured
          from the map.
        </p>
      </div>
    );
  }

  return (
    <ClinicLocationMapInner
      apiKey={key}
      initialLat={initialLat}
      initialLng={initialLng}
      onLocationResolved={onLocationResolved}
      showSearch={showSearch}
      searchInputRef={searchInputRef}
      searchClassName={searchClassName}
      searchPlaceholder={searchPlaceholder}
      hideSearchLabel={hideSearchLabel}
      hideSearchHint={hideSearchHint}
    />
  );
}
