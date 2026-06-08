'use client';

import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { getVetPostAuthPath } from '@/lib/vetRouting';

export default function LoginPage() {
  const router = useRouter();
  const { client, setToken } = useApi();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (normalizedMobile.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await vetAuthApi.sendOtp(client, normalizedMobile);
      setStep('otp');
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      if (apiErr?.statusCode === 404) {
        setError(
          'Backend not reachable. Start the API in another terminal: pnpm --filter @petspond/api dev (and open this app at http://localhost:3001)',
        );
      } else if (
        typeof apiErr?.message === 'string' &&
        /failed to fetch|network error|load failed/i.test(apiErr.message)
      ) {
        setError(
          'Cannot reach API. Ensure the API is running (pnpm --filter @petspond/api dev) and, if opening Vet CRM from another device, set NEXT_PUBLIC_API_URL to your computer’s IP (e.g. http://192.168.1.x:3000) in apps/vet-crm-web/.env.local.',
        );
      } else {
        setError(apiErr?.message ?? 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) {
      setError('Enter the verification code');
      return;
    }
    setLoading(true);
    try {
      const res = await vetAuthApi.verifyOtp(client, normalizedMobile, otp);
      if (!res.verified) {
        setError(res.message ?? 'Invalid or expired code');
        return;
      }
      const jwt = res.token;
      if (jwt) {
        flushSync(() => {
          setToken(jwt);
        });
      }
      if (res.vet) {
        router.replace(getVetPostAuthPath(res.vet, res.pendingClinicInvite));
      } else {
        router.replace('/onboarding/about-you');
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground mb-1">Vet CRM</h1>
        <p className="text-muted text-sm mb-8">Sign in with your mobile number</p>

        {step === 'mobile' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <label className="block text-sm font-medium text-foreground">Mobile number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 14))}
              placeholder="10-digit number"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={14}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || normalizedMobile.length < 10}
              className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-muted">
              Code sent to {normalizedMobile}
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="ml-2 text-primary font-medium"
              >
                Change
              </button>
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest"
              maxLength={8}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
