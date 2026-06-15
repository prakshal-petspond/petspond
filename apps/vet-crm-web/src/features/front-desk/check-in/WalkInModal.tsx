'use client';

import React, { useState } from 'react';

type WalkInModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    petName: string;
    petBreed: string;
    ownerName: string;
    ownerMobile: string;
    totalPaise: number;
  }) => Promise<void>;
};

export function WalkInModal({ open, onClose, onSubmit }: WalkInModalProps) {
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!petName.trim() || !ownerName.trim()) {
      setError('Pet name and owner name are required.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        petName: petName.trim(),
        petBreed: petBreed.trim() || 'Unknown',
        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile.trim(),
        totalPaise: Math.round(parseFloat(amount || '0') * 100),
      });
      setPetName('');
      setPetBreed('');
      setOwnerName('');
      setOwnerMobile('');
      setAmount('');
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Could not add walk-in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-foreground">Add walk-in</h2>
        <p className="mt-1 text-sm text-muted">Creates a check-in and adds the pet to the queue.</p>
        <div className="mt-4 space-y-3">
          <input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Pet name *"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <input
            value={petBreed}
            onChange={(e) => setPetBreed(e.target.value)}
            placeholder="Breed"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Owner name *"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <input
            value={ownerMobile}
            onChange={(e) => setOwnerMobile(e.target.value)}
            placeholder="Owner phone"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Fee (₹)"
            type="number"
            min="0"
            step="1"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:text-foreground">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add walk-in'}
          </button>
        </div>
      </form>
    </div>
  );
}
