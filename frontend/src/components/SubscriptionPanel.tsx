import React, { useState } from 'react';
import { Check, Star, Zap, CreditCard, ExternalLink, Clock, ShieldCheck, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UTRVerificationStatus } from '../backend';
import { useGetMyVerificationStatus, useSubmitUTR, useGetIsPro } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const FREE_FEATURES = [
  '4 conversions / day',
  'Basic compression tools',
  'Universal file converter',
  'PDF merge & split',
  '100% client-side processing',
];

const PRO_FEATURES = [
  'Unlimited conversions / day',
  'Priority processing',
  'Advanced compression options',
  'Batch file processing',
  'All Toolbox features unlocked',
  'Priority support',
];

const PAYMENT_URL = 'https://urpy.link/UhZjQD';

export function SubscriptionPanel() {
  const [showStep2, setShowStep2] = useState(false);
  const [email, setEmail] = useState('');
  const [utrId, setUtrId] = useState('');
  const [emailError, setEmailError] = useState('');
  const [utrError, setUtrError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const { data: verificationStatus, isLoading: statusLoading } = useGetMyVerificationStatus();
  const { data: isProFromBackend, isLoading: isProLoading } = useGetIsPro();
  const submitUTR = useSubmitUTR();

  const handleBuyProClick = () => {
    window.open(PAYMENT_URL, '_blank', 'noopener,noreferrer');
    setShowStep2(true);
  };

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setUtrError('');
    setSubmitError('');

    if (!email.trim()) {
      setEmailError('Email address is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!utrId.trim()) {
      setUtrError('UTR / Transaction ID is required.');
      valid = false;
    } else if (!/^\d{12}$/.test(utrId.trim())) {
      setUtrError('UTR must be exactly 12 numeric digits.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await submitUTR.mutateAsync({ email: email.trim(), utrId: utrId.trim() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(message);
    }
  };

  // isPro is true if backend says so OR if verification is approved
  const isApprovedByVerification = verificationStatus === UTRVerificationStatus.approved;
  const isProUser = (isAuthenticated && isProFromBackend === true) || isApprovedByVerification;

  const isPending =
    verificationStatus === UTRVerificationStatus.pending ||
    submitUTR.isSuccess;

  // Loading state while checking verification status
  if (statusLoading || (isAuthenticated && isProLoading)) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Banner */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'backdrop-blur-md border',
        isProUser
          ? 'bg-teal/15 border-teal/40'
          : 'bg-teal/10 border-teal/30',
      )}>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          isProUser ? 'bg-teal/30 text-teal' : 'bg-teal/20 text-teal',
        )}>
          {isProUser ? <Star className="w-4 h-4 fill-teal" /> : <CreditCard className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-xs text-white/60 leading-none mb-0.5">Active Plan</p>
          <p className="text-sm font-semibold text-teal leading-none">
            {isProUser ? 'Current Plan: Pro ✓' : 'Current Plan: Free'}
          </p>
        </div>
        <div className="ml-auto">
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            isProUser
              ? 'bg-teal/25 border border-teal/40 text-teal'
              : 'bg-teal/15 border border-teal/30 text-teal',
          )}>
            {isProUser ? 'Pro Tier' : 'Free Tier'}
          </span>
        </div>
      </div>

      {/* Login prompt for anonymous users */}
      {!isAuthenticated && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          'backdrop-blur-md bg-violet/10 border border-violet/30',
        )}>
          <LogIn className="w-5 h-5 text-violet shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white/80">
              <span className="font-semibold text-violet">Log in</span> to save your subscription to your account
            </p>
            <p className="text-xs text-white/50 mt-0.5">Your Pro status and usage counter will sync across devices.</p>
          </div>
          <button
            onClick={login}
            disabled={isLoggingIn}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
              'bg-gradient-to-r from-violet/20 to-teal/20 border border-violet/40 text-violet',
              'hover:from-violet/30 hover:to-teal/30 hover:border-violet/60',
              'transition-all duration-200',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {isLoggingIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Login</span>
          </button>
        </div>
      )}

      {/* Approved Pro User Banner */}
      {isProUser && (
        <div className={cn(
          'flex items-center gap-3 px-5 py-4 rounded-xl',
          'backdrop-blur-md bg-gradient-to-r from-teal/15 via-emerald/10 to-teal/15',
          'border border-teal/40 shadow-lg shadow-teal/10',
        )}>
          <ShieldCheck className="w-6 h-6 text-teal shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal">You are a Pro user!</p>
            <p className="text-xs text-white/60 mt-0.5">Enjoy unlimited conversions and all Pro features.</p>
          </div>
        </div>
      )}

      {/* Pending Verification Banner */}
      {isPending && !isProUser && (
        <div className={cn(
          'flex items-center gap-3 px-5 py-4 rounded-xl',
          'backdrop-blur-md bg-gradient-to-r from-amber-500/10 via-teal/10 to-amber-500/10',
          'border border-amber-500/30 shadow-lg shadow-amber-500/5',
        )}>
          <Clock className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Payment Received. Verification in progress (usually 30 mins).</p>
            <p className="text-xs text-white/50 mt-0.5">We'll upgrade your account once the payment is confirmed.</p>
          </div>
        </div>
      )}

      {/* Policy Text */}
      {!isProUser && (
        <div className={cn(
          'px-4 py-3 rounded-xl text-center',
          'backdrop-blur-md bg-white/5 border border-white/10',
        )}>
          <p className="text-sm text-white/75 leading-relaxed">
            Enjoy <span className="text-teal font-semibold">4 free uses</span> every 24 hours.{' '}
            Upgrade to Pro for unlimited access for just{' '}
            <span className="text-teal font-semibold">₹20/year</span>.
          </p>
        </div>
      )}

      {/* Plan Cards — only show when not pending/approved/pro */}
      {!isPending && !isProUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <div className={cn(
            'relative rounded-2xl p-6',
            'backdrop-blur-md bg-white/5 border border-white/10',
            'flex flex-col',
          )}>
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/60">
                Active
              </span>
            </div>

            <div className="mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/70 mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Free Plan</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">₹0</span>
                <span className="text-white/50 text-sm">/ forever</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-medium',
                'bg-white/10 border border-white/15 text-white/40',
                'cursor-default',
              )}
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan Card */}
          <div className={cn(
            'relative rounded-2xl p-6',
            'backdrop-blur-md bg-gradient-to-br from-teal/10 via-white/5 to-emerald/10',
            'border border-teal/30',
            'flex flex-col',
            'shadow-lg shadow-teal/10',
          )}>
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
              style={{ background: 'radial-gradient(ellipse at 30% 20%, oklch(0.72 0.18 185 / 0.15) 0%, transparent 70%)' }}
            />

            <div className="absolute top-4 right-4">
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                'bg-gradient-to-r from-teal/30 to-emerald/30',
                'border border-teal/40 text-teal',
              )}>
                <Star className="w-3 h-3 inline mr-1 fill-teal" />
                Popular
              </span>
            </div>

            <div className="mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center text-teal mb-3">
                <Star className="w-5 h-5 fill-teal" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Pro Plan</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-teal">₹20</span>
                <span className="text-white/50 text-sm">/ year</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6 relative">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Step 1: Buy Pro Button */}
            <div className="relative space-y-3">
              <a
                href={PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBuyProClick}
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-semibold',
                  'bg-gradient-to-r from-teal to-emerald-500',
                  'text-white shadow-lg shadow-teal/30',
                  'hover:shadow-teal/50 hover:brightness-110',
                  'transition-all duration-200',
                  'flex items-center justify-center gap-2',
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Buy Pro — ₹20/year
              </a>
              <p className="text-xs text-white/40 text-center">
                Step 1: Click above to pay via UPI
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: UTR Entry Form */}
      {showStep2 && !isPending && !isProUser && (
        <div className={cn(
          'relative rounded-2xl p-6',
          'backdrop-blur-md bg-gradient-to-br from-teal/8 via-white/5 to-violet/8',
          'border border-teal/30',
          'shadow-xl shadow-teal/10',
        )}>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.72 0.18 185 / 0.2) 0%, transparent 70%)' }}
          />

          <div className="relative space-y-5">
            <div>
              <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal/20 border border-teal/40 text-teal text-xs font-bold flex items-center justify-center shrink-0">2</span>
                Step 2: Enter your 12-digit UPI UTR/Transaction ID from the urpay receipt.
              </h3>
              <p className="text-xs text-white/50 ml-8">
                After completing payment, find the UTR/Transaction ID in your payment receipt.
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 block">
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="you@example.com"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg text-sm',
                  'bg-white/8 border text-white placeholder:text-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-teal/40',
                  'transition-colors duration-150',
                  emailError ? 'border-destructive/60' : 'border-white/15 focus:border-teal/40',
                )}
              />
              {emailError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {emailError}
                </p>
              )}
            </div>

            {/* UTR Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 block">
                UPI UTR / Transaction ID
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={12}
                value={utrId}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setUtrId(val);
                  setUtrError('');
                }}
                placeholder="123456789012"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg text-sm font-mono tracking-widest',
                  'bg-white/8 border text-white placeholder:text-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-teal/40',
                  'transition-colors duration-150',
                  utrError ? 'border-destructive/60' : 'border-white/15 focus:border-teal/40',
                )}
              />
              <p className="text-xs text-white/35">
                {utrId.length}/12 digits entered
              </p>
              {utrError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {utrError}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className={cn(
                'flex items-start gap-2 px-3.5 py-3 rounded-lg',
                'bg-destructive/10 border border-destructive/30',
              )}>
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitUTR.isPending}
              className={cn(
                'w-full py-3 rounded-lg text-sm font-semibold',
                'bg-gradient-to-r from-teal to-emerald-500',
                'text-white shadow-lg shadow-teal/25',
                'hover:brightness-110 transition-all duration-200',
                'flex items-center justify-center gap-2',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {submitUTR.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit for Verification'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
