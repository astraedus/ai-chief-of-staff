"use client";

import type { Category, Urgency, FlagSeverity } from "@/lib/types";

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const styles: Record<Category, string> = {
    DECIDE: "bg-red-50 text-red-700 ring-red-600/20",
    DELEGATE: "bg-amber-50 text-amber-700 ring-amber-600/20",
    IGNORE: "bg-gray-50 text-gray-600 ring-gray-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[category]}`}
    >
      {category}
    </span>
  );
}

interface UrgencyBadgeProps {
  urgency: Urgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const styles: Record<Urgency, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-amber-500 text-white",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-gray-100 text-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[urgency]}`}
    >
      {urgency}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: FlagSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const styles: Record<FlagSeverity, string> = {
    critical: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-blue-500 text-white",
  };

  const icons: Record<FlagSeverity, string> = {
    critical: "!",
    warning: "!",
    info: "i",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[severity]}`}
    >
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/25 text-[10px]">
        {icons[severity]}
      </span>
      {severity}
    </span>
  );
}
