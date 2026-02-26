import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 5)}…${principal.slice(-3)}`;
}

export function LoginHeader() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const principalId = identity?.getPrincipal().toString() ?? '';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        await clear();
        queryClient.clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="glass-card border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <img
          src="/assets/generated/logo-icon.dim_128x128.png"
          alt="FileForge Logo"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <div>
          <h1 className="font-display font-bold text-lg leading-tight glow-text-teal tracking-tight">
            FileForge
          </h1>
          <p className="text-xs text-muted-foreground leading-none">Utility Suite</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="badge-teal hidden sm:inline-flex">Client-Side Processing</span>
          <span className="badge-violet hidden sm:inline-flex">Privacy First</span>

          {/* Auth Section */}
          {isInitializing ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Loader2 className="w-3.5 h-3.5 text-teal animate-spin" />
              <span className="text-xs text-white/50 hidden sm:inline">Loading…</span>
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Principal ID pill */}
              <div className={cn(
                'hidden sm:flex items-center gap-1.5',
                'px-3 py-1.5 rounded-full',
                'backdrop-blur-md bg-teal/10 border border-teal/30',
                'text-xs text-teal font-mono',
              )}>
                <User className="w-3 h-3 shrink-0" />
                <span title={principalId}>{truncatePrincipal(principalId)}</span>
              </div>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  'backdrop-blur-md bg-white/8 border border-white/15',
                  'text-white/70 hover:text-white hover:bg-white/15 hover:border-white/25',
                  'transition-all duration-200',
                )}
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold',
                'backdrop-blur-md bg-gradient-to-r from-teal/20 to-emerald/20',
                'border border-teal/40 text-teal',
                'hover:from-teal/30 hover:to-emerald/30 hover:border-teal/60',
                'transition-all duration-200 shadow-sm shadow-teal/10',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
              aria-label="Login with Internet Identity"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Logging in…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
