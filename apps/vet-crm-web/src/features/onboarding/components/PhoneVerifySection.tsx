'use client';

import React, { useState } from 'react';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { OnboardingField, OnboardingInput } from '../components/OnboardingField';

type PhoneVerifySectionProps = {
  phone: string;
  onPhoneChange: (value: string) => void;
  verified: boolean;
  onVerified: () => void;
};

export function PhoneVerifySection({
  phone,
  onPhoneChange,
  verified,
  onVerified,
}: PhoneVerifySectionProps) {
  const { client } = useApi();
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const normalized = phone.replace(/\D/g, '').slice(-10);

  const handleSend = async () => {
    setError('');
    if (normalized.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setSending(true);
    try {
      await vetAuthApi.onboardingSendPhoneOtp(client, normalized);
      setOtpSent(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to send code');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (otp.length < 4) {
      setError('Enter the verification code');
      return;
    }
    setVerifying(true);
    try {
      await vetAuthApi.onboardingVerifyPhoneOtp(client, normalized, otp);
      onVerified();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <OnboardingField
      label="Phone"
      hint={verified ? 'Verified' : 'We will send a one-time code to verify this number.'}
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <OnboardingInput
            type="tel"
            value={phone}
            onChange={(e) => {
              onPhoneChange(e.target.value);
              setOtpSent(false);
              setOtp('');
            }}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            disabled={verified}
            className="flex-1"
          />
          {!verified ? (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={sending || normalized.length < 10}
              className="shrink-0 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-background-muted disabled:opacity-50"
            >
              {sending ? 'Sending…' : otpSent ? 'Resend code' : 'Send code'}
            </button>
          ) : (
            <span className="flex items-center justify-center rounded-xl bg-success-muted px-4 py-3 text-sm font-semibold text-success">
              ✓ Verified
            </span>
          )}
        </div>

        {!verified && otpSent ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <OnboardingInput
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="flex-1 text-center tracking-widest"
              maxLength={6}
            />
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={verifying || otp.length < 4}
              className="shrink-0 rounded-xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        ) : null}

        {!verified && otpSent ? (
          <p className="text-xs text-muted">Dev tip: use 123456 while OTP bypass is enabled.</p>
        ) : null}

        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </OnboardingField>
  );
}
