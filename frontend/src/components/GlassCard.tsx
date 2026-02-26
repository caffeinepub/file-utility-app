import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, glow, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card',
        glow && 'shadow-glow-teal',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
