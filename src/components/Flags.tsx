"use client";

import { useState } from "react";
import type { Flag, FlagCategory } from "@/lib/types";
import { SeverityBadge } from "./StatusBadge";

interface FlagsProps {
  flags: Flag[];
}

function CategoryIcon({ category }: { category: FlagCategory }) {
  const iconClass = "h-4 w-4";
  switch (category) {
    case "SECURITY":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
    case "REVENUE":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "PEOPLE":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      );
    case "SCHEDULING":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "OPERATIONAL":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
        </svg>
      );
  }
}

const categoryStyles: Record<FlagCategory, { border: string; icon: string }> = {
  SECURITY: { border: "border-l-critical", icon: "text-critical" },
  REVENUE: { border: "border-l-warning", icon: "text-warning" },
  PEOPLE: { border: "border-l-purple", icon: "text-purple" },
  SCHEDULING: { border: "border-l-info", icon: "text-info" },
  OPERATIONAL: { border: "border-l-warning", icon: "text-warning" },
};

function sortFlags(flags: Flag[]): Flag[] {
  const order = { critical: 0, warning: 1, info: 2 };
  return [...flags].sort((a, b) => order[a.severity] - order[b.severity]);
}

export function Flags({ flags }: FlagsProps) {
  const sorted = sortFlags(flags);
  const hasCritical = sorted.some((f) => f.severity === "critical");
  const [open, setOpen] = useState(hasCritical);

  if (sorted.length === 0) return null;

  return (
    <div className="fade-in-up rounded-xl border border-border-default bg-bg-surface overflow-hidden" style={{ animationDelay: "100ms" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg font-semibold text-text-primary tracking-tight">
            Flags & Alerts
          </h2>
          <span className="font-mono text-[11px] text-text-muted tracking-wider">
            {sorted.length} items
          </span>
          {hasCritical && (
            <span className="bg-critical text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Critical
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((flag, i) => {
          const style = categoryStyles[flag.category];
          return (
            <div
              key={i}
              className={`rounded-lg border border-border-default bg-bg-surface border-l-[3px] ${style.border} p-4 fade-in-up card-interactive`}
              style={{ animationDelay: `${(i + 3) * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 ${style.icon}`}>
                    <CategoryIcon category={flag.category} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {flag.title}
                    </h3>
                    <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                      {flag.description}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted mt-2 tracking-wider">
                      Messages {flag.related_message_ids.map((id) => `#${id}`).join(", ")}
                    </p>
                  </div>
                </div>
                <SeverityBadge severity={flag.severity} />
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
