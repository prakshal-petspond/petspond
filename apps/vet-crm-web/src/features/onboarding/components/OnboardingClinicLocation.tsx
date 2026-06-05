'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  ClinicLocationPicker,
  type ClinicLocationResolved,
} from '@/components/ClinicLocationPicker';
import { OnboardingSectionCard } from './OnboardingSectionCard';

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

type OnboardingClinicLocationProps = {
  apiKey: string | undefined;
  address: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (patch: Partial<ClinicLocationResolved & { address: string }>) => void;
};

export function OnboardingClinicLocation({
  apiKey,
  address,
  latitude,
  longitude,
  onChange,
}: OnboardingClinicLocationProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasKey = Boolean(apiKey?.trim());

  // Keep external input in sync when address is set from a saved draft or map pick.
  useEffect(() => {
    if (searchInputRef.current && address && searchInputRef.current.value !== address) {
      searchInputRef.current.value = address;
    }
  }, [address]);

  const onMapResolved = useCallback(
    (p: ClinicLocationResolved) => {
      if (p.address && searchInputRef.current) {
        searchInputRef.current.value = p.address;
      }
      onChange({
        latitude: p.latitude,
        longitude: p.longitude,
        placeId: p.placeId,
        ...(p.address && { address: p.address }),
        ...(p.city && { city: p.city }),
        ...(p.state && { state: p.state }),
        ...(p.pincode && { pincode: p.pincode }),
      });
    },
    [onChange],
  );

  return (
    <OnboardingSectionCard icon={<PinIcon />} iconBg="orange" title="Clinic Location">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-onboarding-accent">
          <PinIcon />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          defaultValue={address}
          placeholder="Enter your clinic address"
          className="w-full rounded-xl border border-input-border bg-card py-3.5 pl-11 pr-4 text-[15px] text-foreground placeholder:text-muted/70 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          autoComplete="off"
        />
      </div>

      <div className="mt-4">
        {hasKey ? (
          <ClinicLocationPicker
            apiKey={apiKey}
            initialLat={latitude}
            initialLng={longitude}
            onLocationResolved={onMapResolved}
            showSearch={false}
            searchInputRef={searchInputRef}
          />
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-input-border/40 bg-gradient-to-b from-[#dceef8] to-[#9ecde8] px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-2xl shadow-sm">
              📍
            </div>
            <p className="text-sm font-semibold text-foreground">Google Maps Preview</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Add your Google Maps API key to enable the interactive map.
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Search above or click on the map to set your clinic&apos;s precise location
      </p>
    </OnboardingSectionCard>
  );
}
