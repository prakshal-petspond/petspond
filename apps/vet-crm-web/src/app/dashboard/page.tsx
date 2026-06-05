'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, getStoredVetToken } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { vetPortalApi } from '@/services/vet-portal.service';
import type {
  Vet,
  Clinic,
  ConsultationBooking,
  VaccinationBooking,
  ClinicInviteDto,
  VetWeeklyAvailabilityBlock,
} from '@petspond/types';
import { ClinicLocationPicker } from '@/components/ClinicLocationPicker';
import { WeeklyScheduleCalendar } from '@/components/WeeklyScheduleCalendar';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Tab =
  | 'overview'
  | 'team'
  | 'clinic'
  | 'bookings'
  | 'schedule'
  | 'invites';

const CONSULT_STATUSES: ConsultationBooking['status'][] = [
  'pending_payment',
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
];

function formatMoney(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { client, token, setToken } = useApi();
  const [vet, setVet] = useState<Vet | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [team, setTeam] = useState<Vet[]>([]);
  const [cons, setCons] = useState<ConsultationBooking[]>([]);
  const [vax, setVax] = useState<VaccinationBooking[]>([]);
  const [invites, setInvites] = useState<ClinicInviteDto[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [inviteMobile, setInviteMobile] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<VetWeeklyAvailabilityBlock[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [teamSchedules, setTeamSchedules] = useState<
    { vetId: string; fullName: string; weeklyAvailability: VetWeeklyAvailabilityBlock[] }[]
  >([]);
  const [scheduleView, setScheduleView] = useState<'me' | string>('me');
  const [clinicForm, setClinicForm] = useState({
    name: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    placeId: '',
    is24_7: false,
    closingTimeLabel: '',
    hours: [] as { day: string; hours: string }[],
    acceptsConsultations: true,
    acceptsVaccinations: true,
  });

  useEffect(() => {
    const effectiveToken = token ?? getStoredVetToken();
    if (!effectiveToken) {
      router.replace('/login');
      return;
    }
    vetAuthApi
      .me(client)
      .then((v) => {
        setVet(v);
        if (v.clinicId && v.isClinicAdmin) {
          return vetAuthApi.getTeam(client, v.clinicId).then((res) => setTeam(res.veterinarians));
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [token, client, router]);

  const refreshPortal = async (v: Vet) => {
    if (v.approvalStatus !== 'approved') return;
    try {
      const payload = await vetPortalApi.getClinic(client);
      setClinic(payload.clinic);
      const h = payload.clinic.hours?.length
        ? payload.clinic.hours.map((x) => ({ day: x.day, hours: x.hours }))
        : [{ day: '', hours: '' }];
      setClinicForm({
        name: payload.clinic.name,
        address: payload.clinic.address,
        pincode: payload.clinic.pincode,
        city: payload.clinic.city ?? '',
        state: payload.clinic.state ?? '',
        latitude:
          payload.clinic.latitude != null && !Number.isNaN(payload.clinic.latitude)
            ? String(payload.clinic.latitude)
            : '',
        longitude:
          payload.clinic.longitude != null && !Number.isNaN(payload.clinic.longitude)
            ? String(payload.clinic.longitude)
            : '',
        placeId: payload.clinic.placeId ?? '',
        is24_7: payload.clinic.is24_7 ?? false,
        closingTimeLabel: payload.clinic.closingTimeLabel ?? '',
        hours: h,
        acceptsConsultations: payload.clinic.acceptsConsultations ?? true,
        acceptsVaccinations: payload.clinic.acceptsVaccinations ?? true,
      });
      const [cList, vList] = await Promise.all([
        vetPortalApi.listConsultations(client),
        vetPortalApi.listVaccinations(client),
      ]);
      setCons(cList);
      setVax(vList);
      if (v.isClinicAdmin && v.clinicId) {
        const inv = await vetPortalApi.listInvites(client);
        setInvites(inv);
      }
    } catch {
      /* clinic may be missing until onboarding completes */
    }
  };

  useEffect(() => {
    if (!vet || vet.approvalStatus !== 'approved') return;
    void refreshPortal(vet);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when vet identity / approval changes
  }, [vet?.id, vet?.approvalStatus, vet?.isClinicAdmin, vet?.clinicId, client]);

  useEffect(() => {
    if (tab !== 'schedule' || vet?.approvalStatus !== 'approved' || !vet?.clinicId) return;
    let cancelled = false;
    setScheduleLoading(true);
    vetPortalApi
      .getMySchedule(client)
      .then((r) => {
        if (!cancelled) setScheduleBlocks(r.weeklyAvailability);
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, vet?.clinicId, vet?.approvalStatus, client]);

  useEffect(() => {
    if (tab !== 'schedule' || !vet?.isClinicAdmin || !vet?.clinicId) return;
    vetPortalApi.getTeamSchedules(client).then(setTeamSchedules).catch(() => setTeamSchedules([]));
  }, [tab, vet?.isClinicAdmin, vet?.clinicId, client]);

  const handleApprove = async (vetId: string) => {
    setApprovingId(vetId);
    try {
      await vetAuthApi.approveVet(client, vetId);
      setTeam((prev) =>
        prev.map((x) => (x.id === vetId ? { ...x, approvalStatus: 'approved' as const } : x)),
      );
    } finally {
      setApprovingId(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteMobile.trim()) return;
    setInviteBusy(true);
    try {
      const inv = await vetPortalApi.inviteDoctor(client, inviteMobile.trim());
      setInvites((prev) => [inv, ...prev]);
      setInviteMobile('');
    } catch {
      alert('Could not send invite (duplicate number or invalid).');
    } finally {
      setInviteBusy(false);
    }
  };

  const saveClinic = async () => {
    if (!vet?.isClinicAdmin) return;
    setClinicSaving(true);
    try {
      const lat = parseFloat(clinicForm.latitude);
      const lng = parseFloat(clinicForm.longitude);
      const hoursPayload = clinicForm.hours
        .filter((row) => row.day.trim() && row.hours.trim())
        .map((row) => ({ day: row.day.trim(), hours: row.hours.trim() }));
      const updated = await vetPortalApi.updateClinic(client, {
        name: clinicForm.name,
        address: clinicForm.address,
        pincode: clinicForm.pincode,
        city: clinicForm.city.trim() || undefined,
        state: clinicForm.state.trim() || undefined,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
        placeId: clinicForm.placeId.trim() || undefined,
        is24_7: clinicForm.is24_7,
        closingTimeLabel: clinicForm.closingTimeLabel.trim() || undefined,
        hours: hoursPayload,
        acceptsConsultations: clinicForm.acceptsConsultations,
        acceptsVaccinations: clinicForm.acceptsVaccinations,
      });
      setClinic(updated);
      setClinicForm((s) => ({
        ...s,
        is24_7: updated.is24_7 ?? false,
        closingTimeLabel: updated.closingTimeLabel ?? '',
        hours:
          updated.hours?.length > 0
            ? updated.hours.map((x) => ({ day: x.day, hours: x.hours }))
            : [{ day: '', hours: '' }],
        acceptsConsultations: updated.acceptsConsultations ?? true,
        acceptsVaccinations: updated.acceptsVaccinations ?? true,
      }));
    } finally {
      setClinicSaving(false);
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
  const isAdmin = vet.isClinicAdmin && !!vet.clinicId;
  const canPortal = vet.approvalStatus === 'approved';

  const saveSchedule = async () => {
    setScheduleSaving(true);
    try {
      const updated = await vetPortalApi.updateMySchedule(client, scheduleBlocks);
      setScheduleBlocks(updated.weeklyAvailability ?? []);
      if (isAdmin) {
        vetPortalApi.getTeamSchedules(client).then(setTeamSchedules).catch(() => {});
      }
    } catch {
      alert('Could not save schedule.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const navTabs: [Tab, string][] = [
    ['overview', 'Overview'],
    ['bookings', 'Bookings'],
  ];
  if (canPortal && vet.clinicId) {
    navTabs.push(['schedule', 'Schedule']);
  }
  if (isAdmin) {
    navTabs.push(['team', 'Team'], ['clinic', 'Clinic profile'], ['invites', 'Invites']);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Vet CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{vet.fullName || vet.mobile}</span>
            <button
              type="button"
              onClick={() => {
                setToken(null);
                router.replace('/login');
              }}
              className="text-sm text-primary hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-wrap gap-2 border-b border-border mb-6 pb-1">
          {navTabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
            <p className="text-muted text-sm">
              Clinic admins manage the public profile, vaccines, fees, and invites. Every approved vet can set their
              own weekly hours under Schedule and manage booking status under Bookings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-success-muted rounded-lg p-4 border border-success/20">
                <p className="text-sm font-medium text-success">Your status</p>
                <p className="text-foreground">{vet.approvalStatus === 'approved' ? 'Approved' : 'Pending approval'}</p>
              </div>
              {vet.clinicId && (
                <div className="bg-primary-muted rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary">Role</p>
                  <p className="text-foreground">{vet.isClinicAdmin ? 'Clinic admin & doctor' : 'Doctor'}</p>
                </div>
              )}
            </div>
            {!canPortal && (
              <p className="text-sm text-warning">
                Bookings and clinic tools unlock after an admin approves your account.
              </p>
            )}
            {clinic && (
              <p className="text-sm text-muted">
                Linked clinic: <span className="text-foreground font-medium">{clinic.name}</span>
              </p>
            )}
          </section>
        )}

        {tab === 'bookings' && (
          <section className="space-y-8">
            {!canPortal ? (
              <p className="text-muted">Available after approval.</p>
            ) : (
              <>
                <div>
                  <h3 className="text-md font-bold text-foreground mb-3">Consultations</h3>
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-card border-b border-border">
                        <tr>
                          <th className="text-left p-3 text-muted">When</th>
                          <th className="text-left p-3 text-muted">Pet parent</th>
                          <th className="text-left p-3 text-muted">Pet</th>
                          <th className="text-left p-3 text-muted">Vet</th>
                          <th className="text-left p-3 text-muted">Pay</th>
                          <th className="text-left p-3 text-muted">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cons.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-muted">
                              No consultation bookings yet.
                            </td>
                          </tr>
                        ) : (
                          cons.map((b) => (
                            <tr key={b.id} className="border-b border-border">
                              <td className="p-3 text-foreground whitespace-nowrap">{formatWhen(b.scheduledAt)}</td>
                              <td className="p-3">
                                <div className="text-foreground">{b.userName ?? '—'}</div>
                                <div className="text-muted text-xs">{b.userMobile}</div>
                              </td>
                              <td className="p-3 text-foreground">
                                {b.petName} ({b.petSpecies})
                              </td>
                              <td className="p-3 text-foreground">{b.vetName ?? b.vetId}</td>
                              <td className="p-3 text-foreground">{formatMoney(b.totalPaise)}</td>
                              <td className="p-3">
                                <select
                                  className="bg-background border border-border rounded-md px-2 py-1 text-foreground"
                                  value={b.status}
                                  onChange={async (e) => {
                                    const status = e.target.value as ConsultationBooking['status'];
                                    const updated = await vetPortalApi.patchConsultation(client, b.id, status);
                                    setCons((prev) => prev.map((x) => (x.id === b.id ? updated : x)));
                                  }}
                                >
                                  {CONSULT_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-bold text-foreground mb-3">Vaccinations</h3>
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-card border-b border-border">
                        <tr>
                          <th className="text-left p-3 text-muted">When</th>
                          <th className="text-left p-3 text-muted">Parent</th>
                          <th className="text-left p-3 text-muted">Pet</th>
                          <th className="text-left p-3 text-muted">Vaccines</th>
                          <th className="text-left p-3 text-muted">Total</th>
                          <th className="text-left p-3 text-muted">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vax.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-muted">
                              No vaccination bookings yet.
                            </td>
                          </tr>
                        ) : (
                          vax.map((b) => (
                            <tr key={b.id} className="border-b border-border">
                              <td className="p-3 text-foreground whitespace-nowrap">{formatWhen(b.scheduledAt)}</td>
                              <td className="p-3">
                                <div className="text-foreground">{b.userName ?? '—'}</div>
                                <div className="text-muted text-xs">{b.userMobile}</div>
                              </td>
                              <td className="p-3 text-foreground">{b.petName}</td>
                              <td className="p-3 text-foreground text-xs">{b.vaccines.map((v) => v.name).join(', ')}</td>
                              <td className="p-3 text-foreground">{formatMoney(b.totalPaise)}</td>
                              <td className="p-3">
                                <select
                                  className="bg-background border border-border rounded-md px-2 py-1 text-foreground"
                                  value={b.status}
                                  onChange={async (e) => {
                                    const status = e.target.value as VaccinationBooking['status'];
                                    const updated = await vetPortalApi.patchVaccination(client, b.id, status);
                                    setVax((prev) => prev.map((x) => (x.id === b.id ? updated : x)));
                                  }}
                                >
                                  {CONSULT_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {tab === 'schedule' && (
          <section className="space-y-6 max-w-5xl">
            {!canPortal || !vet.clinicId ? (
              <p className="text-muted text-sm">
                Join a clinic and get approved to set your weekly availability for bookings.
              </p>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Weekly schedule</h2>
                  <p className="text-sm text-muted mt-1">
                    This calendar controls which times pet parents can pick when they book you. Admins can open any
                    team member to compare schedules.
                  </p>
                </div>
                {isAdmin && teamSchedules.some((t) => t.vetId !== vet.id) && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-medium text-muted uppercase tracking-wide">View</span>
                    <button
                      type="button"
                      onClick={() => setScheduleView('me')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        scheduleView === 'me'
                          ? 'border-primary bg-primary-muted text-primary'
                          : 'border-border text-muted hover:text-foreground'
                      }`}
                    >
                      My calendar
                    </button>
                    {teamSchedules
                      .filter((t) => t.vetId !== vet.id)
                      .map((t) => (
                        <button
                          key={t.vetId}
                          type="button"
                          onClick={() => setScheduleView(t.vetId)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            scheduleView === t.vetId
                              ? 'border-primary bg-primary-muted text-primary'
                              : 'border-border text-muted hover:text-foreground'
                          }`}
                        >
                          {t.fullName}
                        </button>
                      ))}
                  </div>
                )}
                {scheduleLoading && scheduleView === 'me' ? (
                  <p className="text-muted text-sm">Loading your schedule…</p>
                ) : (
                  <WeeklyScheduleCalendar
                    blocks={
                      scheduleView === 'me'
                        ? scheduleBlocks
                        : (teamSchedules.find((x) => x.vetId === scheduleView)?.weeklyAvailability ?? [])
                    }
                    readOnly={scheduleView !== 'me'}
                    onChange={scheduleView === 'me' ? setScheduleBlocks : undefined}
                  />
                )}
                {scheduleView === 'me' && (
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => void saveSchedule()}
                      disabled={scheduleSaving}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
                    >
                      {scheduleSaving ? 'Saving…' : 'Save my schedule'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleBlocks([])}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground"
                    >
                      Clear week
                    </button>
                    <p className="text-xs text-muted">
                      Clearing does not save until you press Save. Empty schedule = all default booking slots stay
                      available.
                    </p>
                  </div>
                )}
                {scheduleView !== 'me' && (
                  <p className="text-xs text-muted">
                    Read-only. {teamSchedules.find((x) => x.vetId === scheduleView)?.fullName ?? 'This doctor'} updates
                    their own hours from their login.
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {tab === 'team' && isAdmin && (
          <section className="space-y-6">
            {pending.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Pending approval</h3>
                <ul className="space-y-3">
                  {pending.map((v) => (
                    <li key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
              <h3 className="text-lg font-semibold text-foreground mb-3">Approved team</h3>
              {approved.length === 0 ? (
                <p className="text-muted text-sm">No approved team members yet.</p>
              ) : (
                <ul className="space-y-3">
                  {approved.map((v) => (
                    <li key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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

        {tab === 'clinic' && isAdmin && clinic && (
          <section className="bg-card rounded-xl p-6 border border-border space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-foreground">Public clinic profile</h3>
            <p className="text-sm text-muted">These fields feed the user app clinic catalog.</p>

            <div className="rounded-lg border border-border bg-muted/15 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Booking channels</h4>
              <p className="text-xs text-muted">
                Turn these on so your clinic appears in the pet parent app lists and accepts that type of booking.
              </p>
              <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border mt-0.5"
                  checked={clinicForm.acceptsConsultations}
                  onChange={(e) => setClinicForm((s) => ({ ...s, acceptsConsultations: e.target.checked }))}
                />
                <span>
                  <span className="font-medium">Accept consultation bookings</span>
                  <span className="block text-muted text-xs mt-0.5">Shows the clinic on Find a Vet and allows visit bookings.</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border mt-0.5"
                  checked={clinicForm.acceptsVaccinations}
                  onChange={(e) => setClinicForm((s) => ({ ...s, acceptsVaccinations: e.target.checked }))}
                />
                <span>
                  <span className="font-medium">Accept vaccination bookings</span>
                  <span className="block text-muted text-xs mt-0.5">Shows the clinic on the vaccination flow when vaccines are configured.</span>
                </span>
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-muted">Name</span>
              <input
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                value={clinicForm.name}
                onChange={(e) => setClinicForm((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Address</span>
              <textarea
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                rows={3}
                value={clinicForm.address}
                onChange={(e) => setClinicForm((s) => ({ ...s, address: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Pincode</span>
              <input
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                value={clinicForm.pincode}
                onChange={(e) => setClinicForm((s) => ({ ...s, pincode: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">City</span>
              <input
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                value={clinicForm.city}
                onChange={(e) => setClinicForm((s) => ({ ...s, city: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">State</span>
              <input
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                value={clinicForm.state}
                onChange={(e) => setClinicForm((s) => ({ ...s, state: e.target.value }))}
              />
            </label>

            <div className="border-t border-border pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Hours &amp; availability</h4>
              <p className="text-xs text-muted">
                Shown on your public clinic profile in the pet parent app. Booking time slots when parents schedule a
                visit are still fixed in the app (morning through late afternoon) until configurable slots are added.
              </p>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={clinicForm.is24_7}
                  onChange={(e) => setClinicForm((s) => ({ ...s, is24_7: e.target.checked }))}
                />
                Open 24/7 (shows a 24/7 badge on listings)
              </label>
              <label className="block text-sm">
                <span className="text-muted">Closing / hours summary (short line for cards)</span>
                <input
                  className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  placeholder="e.g. Closes 8 PM"
                  value={clinicForm.closingTimeLabel}
                  onChange={(e) => setClinicForm((s) => ({ ...s, closingTimeLabel: e.target.value }))}
                />
              </label>
              <div className="space-y-2">
                <span className="text-sm text-muted">Hours by day or range</span>
                {clinicForm.hours.map((row, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                    <input
                      className="flex-1 min-w-[140px] border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm"
                      placeholder="e.g. Mon–Fri"
                      value={row.day}
                      onChange={(e) =>
                        setClinicForm((s) => {
                          const next = [...s.hours];
                          next[idx] = { ...next[idx]!, day: e.target.value };
                          return { ...s, hours: next };
                        })
                      }
                    />
                    <input
                      className="flex-[2] min-w-[180px] border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm"
                      placeholder="e.g. 9:00 AM – 8:00 PM"
                      value={row.hours}
                      onChange={(e) =>
                        setClinicForm((s) => {
                          const next = [...s.hours];
                          next[idx] = { ...next[idx]!, hours: e.target.value };
                          return { ...s, hours: next };
                        })
                      }
                    />
                    <button
                      type="button"
                      className="text-sm text-muted hover:text-foreground px-2"
                      onClick={() =>
                        setClinicForm((s) => ({
                          ...s,
                          hours: s.hours.filter((_, i) => i !== idx),
                        }))
                      }
                      disabled={clinicForm.hours.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={() =>
                    setClinicForm((s) => ({ ...s, hours: [...s.hours, { day: '', hours: '' }] }))
                  }
                >
                  + Add row
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">Clinic on map</h4>
              <p className="text-xs text-muted mb-3">
                Search for your clinic, then adjust the pin if needed. Location is saved for distance and nearest sorting
                in the pet parent app.
              </p>
              <ClinicLocationPicker
                apiKey={GOOGLE_MAPS_KEY}
                initialLat={
                  (() => {
                    const n = parseFloat(clinicForm.latitude);
                    return Number.isFinite(n) ? n : null;
                  })()
                }
                initialLng={
                  (() => {
                    const n = parseFloat(clinicForm.longitude);
                    return Number.isFinite(n) ? n : null;
                  })()
                }
                onLocationResolved={(p) => {
                  setClinicForm((s) => ({
                    ...s,
                    latitude: String(p.latitude),
                    longitude: String(p.longitude),
                    ...(p.placeId !== undefined ? { placeId: p.placeId } : {}),
                    ...(p.address ? { address: p.address } : {}),
                    ...(p.city ? { city: p.city } : {}),
                    ...(p.state ? { state: p.state } : {}),
                    ...(p.pincode ? { pincode: p.pincode } : {}),
                  }));
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => saveClinic()}
              disabled={clinicSaving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
            >
              {clinicSaving ? 'Saving…' : 'Save'}
            </button>
            <p className="text-xs text-muted">
              Edit vaccines and services in MongoDB or a future admin UI — schema supports `vaccinesOffered` and
              `servicesOffered` on the clinic document.
            </p>
          </section>
        )}

        {tab === 'invites' && isAdmin && (
          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Invite doctors</h3>
            <p className="text-sm text-muted">
              Enter a 10-digit Indian mobile. When they sign in to Vet CRM and complete onboarding without choosing
              another clinic, they join yours as pending until you approve.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="border border-border rounded-lg px-3 py-2 bg-background text-foreground flex-1 min-w-[200px]"
                placeholder="Mobile number"
                value={inviteMobile}
                onChange={(e) => setInviteMobile(e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleInvite()}
                disabled={inviteBusy}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {inviteBusy ? 'Sending…' : 'Send invite'}
              </button>
            </div>
            <ul className="divide-y divide-border">
              {invites.map((i) => (
                <li key={i.id} className="py-2 text-sm flex justify-between">
                  <span className="text-foreground">{i.mobile}</span>
                  <span className="text-muted">{new Date(i.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 text-sm text-muted">
          <a href="/onboarding" className="text-primary hover:underline">
            Onboarding
          </a>
        </p>
      </div>
    </main>
  );
}
