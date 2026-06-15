'use client';

import React, { useCallback, useState } from 'react';
import type { ConsultationBooking } from '@petspond/types';
import { useApi } from '@/contexts';
import { frontDeskApi } from '@/services/front-desk.service';
import { PageHeader } from '../shared/PageHeader';
import { useFrontDeskData } from '../shared/useFrontDeskData';
import { SearchSection } from './SearchSection';
import { ExpectedArrivals } from './ExpectedArrivals';
import { TodaySummary } from './TodaySummary';
import { WalkInModal } from './WalkInModal';

export function CheckInPage() {
  const { client } = useApi();
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ConsultationBooking[] | null>(null);

  const { data: board, loading, error, refresh } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getCheckIn(c), []),
  );

  const handleCheckIn = async (id: string) => {
    setCheckingId(id);
    try {
      await frontDeskApi.checkIn(client, id);
      setSearchResults(null);
      await refresh();
    } finally {
      setCheckingId(null);
    }
  };

  const handleSearch = async (q: string) => {
    if (!q) {
      setSearchResults(null);
      return;
    }
    const results = await frontDeskApi.search(client, q);
    setSearchResults(results.filter((b) => b.queueStatus === 'expected'));
  };

  const handleWalkIn = async (data: {
    petName: string;
    petBreed: string;
    ownerName: string;
    ownerMobile: string;
    totalPaise: number;
  }) => {
    await frontDeskApi.createWalkIn(client, {
      petName: data.petName,
      petBreed: data.petBreed,
      ownerName: data.ownerName,
      ownerMobile: data.ownerMobile || undefined,
      totalPaise: data.totalPaise,
      reasonIds: ['walk-in'],
    });
    await refresh();
  };

  if (loading || !board) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading check-in…</p>
      </div>
    );
  }

  const arrivals = searchResults ?? board.expectedArrivals;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1200px]">
        <PageHeader
          title="Check-in"
          actions={
            <button
              type="button"
              onClick={() => setWalkInOpen(true)}
              className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-hover"
            >
              + Add Walk-in
            </button>
          }
        />

        {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

        <div className="space-y-5">
          <SearchSection onSearch={handleSearch} />
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <ExpectedArrivals
              arrivals={arrivals}
              bookedToday={board.summary.bookedToday}
              waitingToCheckIn={board.summary.waitingToCheckIn}
              onCheckIn={handleCheckIn}
              checkingId={checkingId}
            />
            <TodaySummary
              arrived={board.summary.arrived}
              waiting={board.summary.inWaitingRoom}
              noShow={board.summary.noShow}
              recentlyCheckedIn={board.recentlyCheckedIn}
            />
          </div>
        </div>
      </div>

      <WalkInModal open={walkInOpen} onClose={() => setWalkInOpen(false)} onSubmit={handleWalkIn} />
    </div>
  );
}
