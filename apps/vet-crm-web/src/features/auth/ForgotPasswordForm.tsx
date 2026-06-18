'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, KeyRound } from 'lucide-react';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { authErrorMessage, completeVetAuth } from './auth-utils';
import { IconLock, IconMail, authInputClassName } from './AuthFieldIcons';

type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordForm() {
  const router = useRouter();
  const { client, setAuthTokens } = useApi();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await vetAuthApi.forgotPasswordSendOtp(client, email.trim());
      setInfo(res.message ?? 'Verification code sent.');
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
      const res = await vetAuthApi.forgotPasswordVerifyOtp(client, email.trim(), otp);
      setResetToken(res.resetToken);
      setStep('password');
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
      const res = await vetAuthApi.forgotPasswordReset(client, resetToken, password);
      completeVetAuth(router, setAuthTokens, res);
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Could not reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
        <KeyRound className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>

      <h1 className="text-4.5xl font-bold text-foreground">Forgot password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {step === 'email' &&
          'Enter the email linked to your account and we’ll send you a verification code to reset your password.'}
        {step === 'otp' && `Enter the 6-digit code we sent to ${email}.`}
        {step === 'password' && 'Choose a new password for your account.'}
      </p>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Email address</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <IconMail />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meera.shah@petspond.com"
                autoComplete="email"
                required
                className={authInputClassName}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-blue py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-blue/25 hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send verification code'}
          </button>
        </form>
      ) : null}

      {step === 'otp' ? (
        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
          {info ? <p className="text-sm text-muted">{info}</p> : null}
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.3em] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            maxLength={6}
            required
          />
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full rounded-xl bg-brand-blue py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-blue/25 hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify code'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm font-medium text-brand-blue hover:underline"
          >
            Use a different email
          </button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">New password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <IconLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
                className={`${authInputClassName} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-foreground"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Confirm password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <IconLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                minLength={8}
                className={authInputClassName}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-blue py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-blue/25 hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      ) : null}

      <Link
        href="/login"
        className="mt-8 flex items-center justify-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
