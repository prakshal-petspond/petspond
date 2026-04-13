'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi, getStoredVetToken } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { clinicsApi } from '@/services/vet-auth.service';
import {
  VET_QUALIFICATIONS,
  VET_SPECIALIZATIONS,
} from '@petspond/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { client, token, setToken } = useApi();
  const [clinics, setClinics] = useState<{ id: string; name: string; address: string }[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [vetRegNumber, setVetRegNumber] = useState('');
  const [yearOfRegistration, setYearOfRegistration] = useState('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [clinicChoice, setClinicChoice] = useState<'existing' | 'new'>('existing');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicTotalDoctors, setNewClinicTotalDoctors] = useState('1');
  const [newClinicAddress, setNewClinicAddress] = useState('');
  const [newClinicPincode, setNewClinicPincode] = useState('');

  useEffect(() => {
    const effectiveToken = token ?? getStoredVetToken();
    if (!effectiveToken) {
      router.replace('/login');
      return;
    }
    clinicsApi
      .list(client)
      .then((list) => setClinics(list.map((c) => ({ id: c.id, name: c.name, address: c.address }))))
      .catch(() => setClinics([]))
      .finally(() => setLoadingClinics(false));
  }, [token, client, router]);

  const toggleQualification = (q: string) => {
    setQualifications((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
    );
  };
  const toggleSpecialization = (s: string) => {
    setSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !vetRegNumber.trim() || !yearOfRegistration.trim()) {
      setError('Name, registration number, and year of registration are required.');
      return;
    }
    const year = parseInt(yearOfRegistration, 10);
    if (isNaN(year) || year < 1950 || year > 2100) {
      setError('Enter a valid year (1950–2100).');
      return;
    }
    if (clinicChoice === 'existing' && !selectedClinicId) {
      setError('Select a clinic or add a new one.');
      return;
    }
    if (clinicChoice === 'new') {
      if (!newClinicName.trim() || !newClinicAddress.trim() || !newClinicPincode.trim()) {
        setError('Clinic name, address, and pincode are required.');
        return;
      }
    }
    setSubmitLoading(true);
    try {
      await vetAuthApi.completeOnboarding(client, {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        veterinaryRegistrationNumber: vetRegNumber.trim(),
        yearOfRegistration: year,
        qualifications,
        specializations,
        ...(clinicChoice === 'existing' && selectedClinicId
          ? { clinicId: selectedClinicId }
          : clinicChoice === 'new'
            ? {
                newClinic: {
                  name: newClinicName.trim(),
                  totalDoctors: Math.max(1, parseInt(newClinicTotalDoctors, 10) || 1),
                  address: newClinicAddress.trim(),
                  pincode: newClinicPincode.trim(),
                },
              }
            : {}),
      });
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to save. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!token && !getStoredVetToken()) return null;

  return (
    <main className="min-h-screen bg-background p-6 pb-12">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-primary hover:underline mb-6 inline-block">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-2">Complete your profile</h1>
        <p className="text-muted text-sm mb-8">Enter your details and clinic information.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Doctor details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Veterinary registration number *</label>
                <input
                  type="text"
                  value={vetRegNumber}
                  onChange={(e) => setVetRegNumber(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="e.g. REG12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Year of registration *</label>
                <input
                  type="number"
                  min={1950}
                  max={2100}
                  value={yearOfRegistration}
                  onChange={(e) => setYearOfRegistration(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="e.g. 2018"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Qualifications</label>
                <div className="flex flex-wrap gap-2">
                  {VET_QUALIFICATIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => toggleQualification(q)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        qualifications.includes(q)
                          ? 'bg-primary text-white'
                          : 'bg-tag text-foreground'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {VET_SPECIALIZATIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialization(s)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        specializations.includes(s)
                          ? 'bg-primary text-white'
                          : 'bg-tag text-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Clinic</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clinicChoice"
                    checked={clinicChoice === 'existing'}
                    onChange={() => setClinicChoice('existing')}
                    className="text-primary"
                  />
                  <span className="text-foreground">Join existing clinic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clinicChoice"
                    checked={clinicChoice === 'new'}
                    onChange={() => setClinicChoice('new')}
                    className="text-primary"
                  />
                  <span className="text-foreground">Add new clinic</span>
                </label>
              </div>
              {clinicChoice === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Select clinic</label>
                  <select
                    value={selectedClinicId}
                    onChange={(e) => setSelectedClinicId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    disabled={loadingClinics}
                  >
                    <option value="">Choose a clinic</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} – {c.address}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">You will need approval from the clinic admin.</p>
                </div>
              )}
              {clinicChoice === 'new' && (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted">You will be the admin of this clinic.</p>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Clinic name *</label>
                    <input
                      type="text"
                      value={newClinicName}
                      onChange={(e) => setNewClinicName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      placeholder="PetCare Veterinary Clinic"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Number of doctors</label>
                    <input
                      type="number"
                      min={1}
                      value={newClinicTotalDoctors}
                      onChange={(e) => setNewClinicTotalDoctors(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Address *</label>
                    <input
                      type="text"
                      value={newClinicAddress}
                      onChange={(e) => setNewClinicAddress(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      placeholder="Full address (Google Maps search can be added later)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={newClinicPincode}
                      onChange={(e) => setNewClinicPincode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      placeholder="e.g. 110001"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitLoading}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            {submitLoading ? 'Saving…' : 'Complete onboarding'}
          </button>
        </form>
      </div>
    </main>
  );
}
