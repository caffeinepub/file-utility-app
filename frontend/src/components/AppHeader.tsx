import React from 'react';

export function AppHeader() {
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
        <div className="ml-auto flex items-center gap-2">
          <span className="badge-teal hidden sm:inline-flex">Client-Side Processing</span>
          <span className="badge-violet hidden sm:inline-flex">Privacy First</span>
        </div>
      </div>
    </header>
  );
}
