import React from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-white/5 bg-card/40 backdrop-blur-md shadow-xs transition-all",
        className
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-xs">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <h3 className="mt-4 font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
