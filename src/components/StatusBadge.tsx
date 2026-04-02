"use client";

import type { Category, Urgency, FlagSeverity } from "@/lib/types";

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const styles: Record<Category, string> = {
    DECIDE: "bg-[var(--critical-bg)] text-critical border border-[var(--critical-border)]",
    DELEGATE: "bg-[var(--warning-bg)] text-warning border border-[var(--warning-border)]",
    IGNORE: "bg-bg-elevated text-text-muted border border-border-default",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase ${styles[category]}`}>
      {category}
    </span>
  );
}

interface UrgencyBadgeProps {
  urgency: Urgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const styles: Record<Urgency, string> = {
    critical: "bg-critical text-white",
    high: "bg-warning text-text-inverse",
    medium: "bg-[var(--info-bg)] text-info border border-[var(--info-border)]",
    low: "bg-bg-elevated text-text-muted border border-border-default",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[urgency]}`}>
      {urgency}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: FlagSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const styles: Record<FlagSeverity, string> = {
    critical: "bg-critical text-white",
    warning: "bg-warning text-text-inverse",
    info: "bg-info text-white",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shrink-0 ${styles[severity]}`}>
      {severity}
    </span>
  );
}
