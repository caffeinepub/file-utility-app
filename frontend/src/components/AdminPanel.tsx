import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Loader2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type UTRSubmission } from '../backend';
import { useGetPendingVerifications, useApproveUTR } from '../hooks/useQueries';
import type { Principal } from '@icp-sdk/core/principal';

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function PendingCard({
  submission,
  onApprove,
  isApproving,
  justApproved,
}: {
  submission: UTRSubmission;
  onApprove: (principal: Principal) => void;
  isApproving: boolean;
  justApproved: boolean;
}) {
  return (
    <div className={cn(
      'relative rounded-xl p-5',
      'backdrop-blur-md bg-white/5 border',
      'transition-all duration-300',
      justApproved
        ? 'border-teal/50 bg-teal/8'
        : 'border-white/10 hover:border-teal/25',
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-teal/70">
              Pending
            </span>
            <Clock className="w-3 h-3 text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-white truncate">{submission.email}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">UTR:</span>
            <span className="text-sm font-mono text-teal tracking-widest">{submission.utrId}</span>
          </div>
          <p className="text-xs text-white/40">
            Submitted: {formatTimestamp(submission.submittedAt)}
          </p>
          <p className="text-xs text-white/30 font-mono truncate">
            Principal: {submission.principal.toString()}
          </p>
        </div>

        <div className="shrink-0">
          {justApproved ? (
            <div className="flex items-center gap-2 text-teal text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Approved!
            </div>
          ) : (
            <button
              onClick={() => onApprove(submission.principal)}
              disabled={isApproving}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold',
                'bg-gradient-to-r from-teal to-emerald-500',
                'text-white shadow-md shadow-teal/20',
                'hover:brightness-110 transition-all duration-200',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const { data: pendingList, isLoading, error, refetch, isFetching } = useGetPendingVerifications();
  const approveUTR = useApproveUTR();
  const [approvingPrincipal, setApprovingPrincipal] = useState<string | null>(null);
  const [approvedPrincipals, setApprovedPrincipals] = useState<Set<string>>(new Set());

  const handleApprove = async (principal: Principal) => {
    const key = principal.toString();
    setApprovingPrincipal(key);
    try {
      await approveUTR.mutateAsync(principal);
      setApprovedPrincipals((prev) => new Set([...prev, key]));
    } catch {
      // error handled by mutation state
    } finally {
      setApprovingPrincipal(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        {/* Header */}
        <div className={cn(
          'flex items-center gap-3 px-5 py-4 rounded-xl',
          'backdrop-blur-md bg-white/5 border border-white/10',
        )}>
          <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center text-teal">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Admin — Pending UTR Verifications</h1>
            <p className="text-xs text-white/50 mt-0.5">Review and approve UPI payment submissions</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-white/8 border border-white/15 text-white/70',
              'hover:bg-white/12 hover:text-white transition-all duration-150',
              'disabled:opacity-50',
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Generic Error */}
        {error && (
          <div className={cn(
            'flex items-center gap-3 px-5 py-4 rounded-xl',
            'backdrop-blur-md bg-destructive/10 border border-destructive/30',
          )}>
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load pending verifications.'}
            </p>
          </div>
        )}

        {/* Loading verifications */}
        {isLoading && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && pendingList && pendingList.length === 0 && (
          <div className={cn(
            'flex flex-col items-center gap-3 px-5 py-12 rounded-xl text-center',
            'backdrop-blur-md bg-white/5 border border-white/10',
          )}>
            <CheckCircle2 className="w-10 h-10 text-teal/50" />
            <p className="text-sm font-medium text-white/60">No pending verifications</p>
            <p className="text-xs text-white/35">All submissions have been reviewed.</p>
          </div>
        )}

        {/* Pending List */}
        {!isLoading && !error && pendingList && pendingList.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-white/40 px-1">
              {pendingList.length} pending submission{pendingList.length !== 1 ? 's' : ''}
            </p>
            {pendingList.map((submission) => {
              const key = submission.principal.toString();
              return (
                <PendingCard
                  key={key}
                  submission={submission}
                  onApprove={handleApprove}
                  isApproving={approvingPrincipal === key}
                  justApproved={approvedPrincipals.has(key)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
