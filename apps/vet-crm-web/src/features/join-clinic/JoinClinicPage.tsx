'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { VetPendingClinicInvite } from '@petspond/types';
import { useApi, getStoredVetToken } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { getVetPostAuthPath } from '@/lib/vetRouting';
import { clinicInviteLabel, isValidClinicInvite } from '@/lib/clinicInvite';

export function JoinClinicPage() {
  const router = useRouter();
  const { client } = useApi();
  const [invite, setInvite] = useState<VetPendingClinicInvite | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getStoredVetToken()) {
      router.replace('/login');
      return;
    }
    void (async () => {
      try {
        const [pending, me] = await Promise.all([
          vetAuthApi.getPendingClinicInvite(client),
          vetAuthApi.me(client),
        ]);

        if (!isValidClinicInvite(pending)) {
          router.replace(getVetPostAuthPath(me, pending));
          return;
        }

        setInvite(pending);
      } catch {
        router.replace('/login');
      }
    })();
  }, [client, router]);

  const goToDashboard = () => {
    router.replace('/dashboard');
  };

  const handleAccept = async () => {
    if (accepting) return;
    setError('');
    setAccepting(true);
    try {
      await vetAuthApi.acceptClinicInvite(client);
      goToDashboard();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? '';
      if (/already joined|no pending clinic invitation/i.test(message)) {
        goToDashboard();
        return;
      }
      setError(message || 'Could not accept invitation. Try again.');
      setAccepting(false);
    }
  };

  if (invite === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-muted">Loading invitation…</p>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-muted">Redirecting…</p>
      </main>
    );
  }

  const clinicName = clinicInviteLabel(invite);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Clinic invitation</p>
        <h1 className="mt-3 font-serif text-2xl font-medium text-foreground">
          Join {clinicName}?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          This clinic has added you as one of their doctors. Accept the invitation to access your dashboard,
          appointments, and schedule.
        </p>

        {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting}
          className="mt-6 w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50"
        >
          {accepting ? 'Joining clinic…' : 'Accept & go to dashboard'}
        </button>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/login" className="text-brand-blue hover:underline">
            Sign in with a different account
          </Link>
        </p>
      </div>
    </main>
  );
}
