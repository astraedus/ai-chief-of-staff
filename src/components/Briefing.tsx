"use client";

import type { DailyBriefing } from "@/lib/types";

interface BriefingProps {
  briefing: DailyBriefing;
}

function MorningTypeIndicator({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  const config: Record<string, { color: string; dot: string; label: string }> = {
    calm: { color: "text-success", dot: "bg-success", label: "All clear" },
    busy: { color: "text-warning", dot: "bg-warning", label: "Heads up" },
    crisis: { color: "text-critical", dot: "bg-critical", label: "Action required" },
    hectic: { color: "text-warning", dot: "bg-warning", label: "Heads up" },
  };

  const c = config[normalized] || config.busy;

  return (
    <div className={`inline-flex items-center gap-2 ${c.color}`}>
      <span className={`h-2 w-2 rounded-full ${c.dot} glow-pulse`} />
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
        {c.label} &mdash; {type}
      </span>
    </div>
  );
}

function BulletList({
  items,
  icon,
  iconColor,
}: {
  items: string[];
  icon: React.ReactNode;
  iconColor: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] text-text-primary leading-relaxed">
          <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Briefing({ briefing }: BriefingProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface overflow-hidden fade-in-up" style={{ animationDelay: "50ms" }}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-text-primary tracking-tight">
            Daily Briefing
          </h2>
          <MorningTypeIndicator type={briefing.morning_type} />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{briefing.summary}</p>
      </div>

      {/* Sections */}
      <div className="border-t border-border-subtle px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {briefing.critical_actions?.length > 0 && (
          <BriefingSection
            title="Immediate Action"
            titleColor="text-critical"
            borderColor="border-critical"
            items={briefing.critical_actions}
            iconColor="text-critical"
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            }
          />
        )}

        {briefing.decisions_needed?.length > 0 && (
          <BriefingSection
            title="Decisions Needed"
            titleColor="text-warning"
            borderColor="border-warning"
            items={briefing.decisions_needed}
            iconColor="text-warning"
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            }
          />
        )}

        {briefing.good_news?.length > 0 && (
          <BriefingSection
            title="Good News"
            titleColor="text-success"
            borderColor="border-success"
            items={briefing.good_news}
            iconColor="text-success"
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          />
        )}

        {briefing.upcoming_deadlines?.length > 0 && (
          <BriefingSection
            title="This Week"
            titleColor="text-info"
            borderColor="border-info"
            items={briefing.upcoming_deadlines}
            iconColor="text-info"
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}

function BriefingSection({
  title,
  titleColor,
  borderColor,
  items,
  iconColor,
  icon,
}: {
  title: string;
  titleColor: string;
  borderColor: string;
  items: string[];
  iconColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`pl-4 border-l-2 ${borderColor}/40`}>
      <h3 className={`font-mono text-[10px] font-bold uppercase tracking-[0.15em] mb-2.5 ${titleColor}`}>
        {title}
      </h3>
      <BulletList items={items} iconColor={iconColor} icon={icon} />
    </div>
  );
}
