'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Clinic, ClinicStaffMember, ConsultationBooking, Vet } from '@petspond/types';
import { useApi, getStoredVetToken } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { vetPortalApi } from '@/services/vet-portal.service';
import { getVetPostAuthPath } from '@/lib/vetRouting';

type DashboardContextValue = {
  vet: Vet | null;
  clinic: Clinic | null;
  team: Vet[];
  frontOfficeStaff: ClinicStaffMember[];
  consultations: ConsultationBooking[];
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { client, token, setToken } = useApi();
  const [vet, setVet] = useState<Vet | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [team, setTeam] = useState<Vet[]>([]);
  const [frontOfficeStaff, setFrontOfficeStaff] = useState<ClinicStaffMember[]>([]);
  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const effectiveToken = token ?? getStoredVetToken();
    if (!effectiveToken) {
      router.replace('/login');
      return;
    }
    let keepLoading = false;
    try {
      const me = await vetAuthApi.me(client);
      const pendingInvite = await vetAuthApi.getPendingClinicInvite(client).catch(() => null);
      const redirectPath = getVetPostAuthPath(me, pendingInvite);
      if (redirectPath !== '/dashboard') {
        keepLoading = true;
        router.replace(redirectPath);
        return;
      }
      setVet(me);

      if (me.approvalStatus === 'approved' && me.clinicId) {
        const [clinicPayload, cons] = await Promise.all([
          vetPortalApi.getClinic(client).catch(() => null),
          vetPortalApi.listConsultations(client).catch(() => [] as ConsultationBooking[]),
        ]);
        if (clinicPayload) setClinic(clinicPayload.clinic);
        setConsultations(cons);

        if (me.isClinicAdmin) {
          const teamRes = await vetAuthApi.getTeam(client, me.clinicId).catch(() => null);
          if (teamRes) {
            setTeam(teamRes.veterinarians);
            setFrontOfficeStaff(teamRes.frontOfficeStaff);
          }
        } else if (me.clinicId) {
          setTeam([me]);
        }
      }
    } catch {
      router.replace('/login');
    } finally {
      if (!keepLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, client]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      vet,
      clinic,
      team,
      frontOfficeStaff,
      consultations,
      loading,
      refresh: load,
      signOut: () => {
        setToken(null);
        router.replace('/login');
      },
    }),
    [vet, clinic, team, frontOfficeStaff, consultations, loading, setToken, router],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

export function vetInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? 'DR').toUpperCase();
}

export function petInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function formatDashboardDate(d = new Date()) {
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return iso;
  }
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function formatMoney(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
