'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { authErrorMessage, completeVetAuth } from './auth-utils';
import { GoogleSignInButton } from './GoogleSignInButton';

type Step = 'email' | 'otp' | 'password';

export function RegisterForm() {
  const router = useRouter();
  const { client, setAuthTokens } = useApi();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await vetAuthApi.registerSendEmailOtp(client, email.trim());
      setStep('otp');
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Failed to send verification code'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await vetAuthApi.registerVerifyEmailOtp(client, email.trim(), otp);
      setRegistrationToken(res.registrationToken);
      setStep('password');
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await vetAuthApi.registerSetPassword(client, registrationToken, password);
      completeVetAuth(router, setAuthTokens, res);
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await vetAuthApi.googleAuth(client, idToken);
      completeVetAuth(router, setAuthTokens, res);
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Google sign-in failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        {step === 'email' && 'Enter your work email to get started'}
        {step === 'otp' && `We sent a code to ${email}`}
        {step === 'password' && 'Choose a secure password for your account'}
      </p>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="meera.shah@petspond.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send verification code'}
          </button>
        </form>
      ) : null}

      {step === 'otp' ? (
        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg tracking-[0.3em] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            maxLength={6}
            required
          />
          <p className="text-xs text-muted">Dev tip: use 123456 while OTP bypass is enabled.</p>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify email'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm font-medium text-brand-blue hover:underline"
          >
            Change email
          </button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form onSubmit={handleSetPassword} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account & continue'}
          </button>
        </form>
      ) : null}

      {step === 'email' ? (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton onSuccess={handleGoogle} onError={setError} />
        </>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
