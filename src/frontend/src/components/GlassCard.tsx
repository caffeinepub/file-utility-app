import { cn } from "@/lib/utils";
import type React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  glow,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "glass-card",
        glow && "shadow-glow-teal",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
