"use client";

import type { DailyBriefing } from "@/lib/types";

interface BriefingProps {
  briefing: DailyBriefing;
}

function MorningTypeIndicator({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  const config: Record<string, { color: string; bg: string; icon: string }> = {
    calm: { color: "text-green-700", bg: "bg-green-50", icon: "All clear" },
    busy: { color: "text-amber-700", bg: "bg-amber-50", icon: "Heads up" },
    crisis: { color: "text-red-700", bg: "bg-red-50", icon: "Action required" },
    hectic: { color: "text-amber-700", bg: "bg-amber-50", icon: "Heads up" },
  };

  const c = config[normalized] || config.busy;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.color} ${c.bg}`}>
      <span className={`h-2 w-2 rounded-full ${c.color.replace("text-", "bg-")}`} />
      {c.icon} -- {type} morning
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
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Briefing({ briefing }: BriefingProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Daily Briefing</h2>
          <MorningTypeIndicator type={briefing.morning_type} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{briefing.summary}</p>
      </div>

      <div className="border-t border-gray-100 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Critical actions */}
        {briefing.critical_actions?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
              Immediate Action Required
            </h3>
            <BulletList
              items={briefing.critical_actions}
              iconColor="text-red-500"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Decisions needed */}
        {briefing.decisions_needed?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
              Decisions Needed Today
            </h3>
            <BulletList
              items={briefing.decisions_needed}
              iconColor="text-amber-500"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Good news */}
        {briefing.good_news?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
              Good News
            </h3>
            <BulletList
              items={briefing.good_news}
              iconColor="text-green-500"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Upcoming deadlines */}
        {briefing.upcoming_deadlines?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
              Upcoming This Week
            </h3>
            <BulletList
              items={briefing.upcoming_deadlines}
              iconColor="text-blue-500"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
