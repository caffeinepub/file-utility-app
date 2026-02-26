import React from 'react';
import { X, Lock, CreditCard, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSubscription: () => void;
}

export function LimitReachedModal({ isOpen, onClose, onNavigateToSubscription }: LimitReachedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm',
          'glass-card p-6',
          'border border-teal/30 shadow-glow-teal',
          'animate-fade-in',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/25 flex items-center justify-center">
            <Lock className="w-7 h-7 text-teal" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center font-display font-bold text-xl text-foreground mb-2">
          Limit Reached
        </h2>

        {/* Description */}
        <p className="text-center text-sm text-muted-foreground mb-1">
          You've used all <span className="text-teal font-semibold">4 free operations</span> for today.
        </p>
        <p className="text-center text-sm text-muted-foreground mb-5">
          Upgrade to Pro for unlimited daily use.
        </p>

        {/* Price highlight */}
        <div className={cn(
          'flex items-center justify-center gap-2 mb-5',
          'py-3 px-4 rounded-xl',
          'bg-gradient-to-r from-teal/10 via-teal/15 to-teal/10',
          'border border-teal/25',
        )}>
          <Zap className="w-4 h-4 text-teal" />
          <span className="text-base font-bold text-teal">Upgrade for ₹20</span>
          <span className="text-xs text-muted-foreground">/ year</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onNavigateToSubscription();
              onClose();
            }}
            className="btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            View Subscription Plans
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8 hover:text-foreground transition-all"
          >
            Maybe Later
          </button>
        </div>

        {/* Reset note */}
        <p className="text-center text-xs text-muted-foreground/60 mt-4">
          Free uses reset daily at midnight
        </p>
      </div>
    </div>
  );
}
