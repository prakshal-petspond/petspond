'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import type { Vet } from '@petspond/types';

export default function DashboardPage() {
  const router = useRouter();
  const { client, token } = useApi();
  const [vet, setVet] = useState<Vet | null>(null);
  const [team, setTeam] = useState<Vet[]>([]);
  const [tab, setTab] = useState<'overview' | 'team'>('overview');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    vetAuthApi
      .me(client)
      .then((v) => {
        setVet(v);
        if (v.clinicId && v.isClinicAdmin) {
          return vetAuthApi.getTeam(client, v.clinicId).then(setTeam);
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [token, client, router]);

  const handleApprove = async (vetId: string) => {
    setApprovingId(vetId);
    try {
      await vetAuthApi.approveVet(client, vetId);
      setTeam((prev) =>
        prev.map((v) => (v.id === vetId ? { ...v, approvalStatus: 'approved' as const } : v)),
      );
    } finally {
      setApprovingId(null);
    }
  };

  if (loading || !vet) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  const pending = team.filter((v) => v.approvalStatus === 'pending');
  const approved = team.filter((v) => v.approvalStatus === 'approved');

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Vet CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{vet.fullName || vet.mobile}</span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('vet-crm-token');
                  router.replace('/login');
                }
              }}
              className="text-sm text-primary hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-4 border-b border-border mb-6">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Overview
          </button>
          {vet.isClinicAdmin && vet.clinicId && (
            <button
              type="button"
              onClick={() => setTab('team')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === 'team'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              My Team
            </button>
          )}
        </div>

        {tab === 'overview' && (
          <section className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Dashboard</h2>
            <p className="text-muted">
              Revenue, appointments, and inventory overview (to be built).
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-success-muted rounded-lg p-4 border border-success/20">
                <p className="text-sm font-medium text-success">Status</p>
                <p className="text-foreground">
                  {vet.approvalStatus === 'approved' ? 'Approved' : 'Pending approval'}
                </p>
              </div>
              {vet.clinicId && (
                <div className="bg-primary-muted rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary">Clinic</p>
                  <p className="text-foreground">
                    {vet.isClinicAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'team' && vet.isClinicAdmin && (
          <section className="space-y-6">
            {pending.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Pending approval
                </h3>
                <ul className="space-y-3">
                  {pending.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{v.fullName || v.mobile}</p>
                        <p className="text-sm text-muted">{v.mobile}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApprove(v.id)}
                        disabled={approvingId === v.id}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                      >
                        {approvingId === v.id ? 'Approving…' : 'Approve'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                Approved
              </h3>
              {approved.length === 0 ? (
                <p className="text-muted text-sm">No approved team members yet.</p>
              ) : (
                <ul className="space-y-3">
                  {approved.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{v.fullName || v.mobile}</p>
                        <p className="text-sm text-muted">{v.mobile}</p>
                      </div>
                      <span className="text-xs text-success font-medium">Approved</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
