"use client";

import { useState } from "react";
import type { RawMessage, ClassifiedMessage, Category, Correction } from "@/lib/types";
import { MessageCard } from "./MessageCard";

interface TriageViewProps {
  messages: RawMessage[];
  classifications: ClassifiedMessage[];
  onOverride?: (messageId: number, newCategory: Category) => void;
  corrections?: Correction[];
}

const columns: { key: Category; label: string; accent: string; border: string }[] = [
  { key: "DECIDE", label: "Decide", accent: "text-critical", border: "border-critical/30" },
  { key: "DELEGATE", label: "Delegate", accent: "text-warning", border: "border-warning/30" },
  { key: "IGNORE", label: "Ignore", accent: "text-text-muted", border: "border-border-default" },
];

export function TriageView({ messages, classifications, onOverride, corrections }: TriageViewProps) {
  const [expandedColumn, setExpandedColumn] = useState<Category | null>(null);

  const classificationMap = new Map(
    classifications.map((c) => [c.id, c])
  );

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  function getColumnMessages(category: Category) {
    return messages
      .filter((msg) => {
        const c = classificationMap.get(msg.id);
        return c?.category === category;
      })
      .sort((a, b) => {
        const ca = classificationMap.get(a.id);
        const cb = classificationMap.get(b.id);
        if (!ca || !cb) return 0;
        return urgencyOrder[ca.urgency] - urgencyOrder[cb.urgency];
      });
  }

  // Mobile: toggle columns
  const isMobileExpanded = (cat: Category) => expandedColumn === cat;
  const toggleColumn = (cat: Category) =>
    setExpandedColumn((prev) => (prev === cat ? null : cat));

  return (
    <div className="fade-in-up" style={{ animationDelay: "150ms" }}>
      <h2 className="font-serif text-xl font-semibold text-text-primary tracking-tight mb-5">
        Message Triage
      </h2>

      {/* Desktop: 3-column kanban */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const msgs = getColumnMessages(col.key);
          return (
            <div key={col.key} className={`rounded-xl border ${col.border} bg-bg-surface/50 overflow-hidden`}>
              {/* Column header */}
              <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className={`font-mono text-[11px] font-bold uppercase tracking-[0.15em] ${col.accent}`}>
                    {col.label}
                  </h3>
                </div>
                <span className={`font-serif text-lg font-bold ${col.accent}`}>
                  {msgs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                {msgs.map((msg, i) => {
                  const classification = classificationMap.get(msg.id);
                  if (!classification) return null;
                  const wasOverridden = corrections?.some((c) => c.message_id === msg.id);
                  return (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      classification={classification}
                      index={i}
                      compact
                      onOverride={onOverride}
                      wasOverridden={wasOverridden}
                    />
                  );
                })}
                {msgs.length === 0 && (
                  <p className="py-6 text-center text-[12px] text-text-muted">
                    No messages
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: collapsible columns */}
      <div className="md:hidden space-y-3">
        {columns.map((col) => {
          const msgs = getColumnMessages(col.key);
          const isOpen = isMobileExpanded(col.key);
          return (
            <div key={col.key} className={`rounded-xl border ${col.border} bg-bg-surface/50 overflow-hidden`}>
              <button
                onClick={() => toggleColumn(col.key)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <h3 className={`font-mono text-[11px] font-bold uppercase tracking-[0.15em] ${col.accent}`}>
                    {col.label}
                  </h3>
                  <span className={`font-serif text-lg font-bold ${col.accent}`}>
                    {msgs.length}
                  </span>
                </div>
                <svg
                  className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="p-2 pt-0 space-y-2 border-t border-border-subtle">
                  {msgs.map((msg, i) => {
                    const classification = classificationMap.get(msg.id);
                    if (!classification) return null;
                    const wasOverridden = corrections?.some((c) => c.message_id === msg.id);
                    return (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        classification={classification}
                        index={i}
                        compact
                        onOverride={onOverride}
                        wasOverridden={wasOverridden}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
