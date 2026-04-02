"use client";

import { useState } from "react";
import type { RawMessage, ClassifiedMessage, Category, Correction } from "@/lib/types";
import { ChannelIcon } from "./ChannelIcon";
import { UrgencyBadge } from "./StatusBadge";
import { MessageModal } from "./MessageModal";

interface TriageViewProps {
  messages: RawMessage[];
  classifications: ClassifiedMessage[];
  onOverride?: (messageId: number, newCategory: Category) => void;
  corrections?: Correction[];
}

const columns: { key: Category; label: string; sublabel: string; accent: string; border: string }[] = [
  { key: "DECIDE", label: "Decide", sublabel: "CEO must act", accent: "text-critical", border: "border-critical/30" },
  { key: "DELEGATE", label: "Delegate", sublabel: "Assigned to someone", accent: "text-warning", border: "border-warning/30" },
  { key: "IGNORE", label: "Ignore", sublabel: "No action needed", accent: "text-text-muted", border: "border-border-default" },
];

function getSenderName(from: string): string {
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from;
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function TriageView({ messages, classifications, onOverride, corrections }: TriageViewProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedColumn, setExpandedColumn] = useState<Category | null>(null);

  const classificationMap = new Map(classifications.map((c) => [c.id, c]));
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  function getColumnMessages(category: Category) {
    return messages
      .filter((msg) => classificationMap.get(msg.id)?.category === category)
      .sort((a, b) => {
        const ca = classificationMap.get(a.id);
        const cb = classificationMap.get(b.id);
        if (!ca || !cb) return 0;
        return urgencyOrder[ca.urgency] - urgencyOrder[cb.urgency];
      });
  }

  const selectedMsg = selectedId !== null ? messages.find((m) => m.id === selectedId) : null;
  const selectedClassification = selectedId !== null ? classificationMap.get(selectedId) : null;

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
              <div className="px-4 py-3 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <h3 className={`font-mono text-[11px] font-bold uppercase tracking-[0.15em] ${col.accent}`}>
                    {col.label}
                  </h3>
                  <span className={`font-serif text-lg font-bold ${col.accent}`}>{msgs.length}</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{col.sublabel}</p>
              </div>
              <div className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
                {msgs.map((msg, i) => {
                  const c = classificationMap.get(msg.id);
                  if (!c) return null;
                  return (
                    <KanbanCard
                      key={msg.id}
                      message={msg}
                      classification={c}
                      index={i}
                      onClick={() => setSelectedId(msg.id)}
                    />
                  );
                })}
                {msgs.length === 0 && (
                  <p className="py-6 text-center text-[12px] text-text-muted">No messages</p>
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
          const isOpen = expandedColumn === col.key;
          return (
            <div key={col.key} className={`rounded-xl border ${col.border} bg-bg-surface/50 overflow-hidden`}>
              <button
                onClick={() => setExpandedColumn(isOpen ? null : col.key)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <h3 className={`font-mono text-[11px] font-bold uppercase tracking-[0.15em] ${col.accent}`}>
                    {col.label}
                  </h3>
                  <span className={`font-serif text-lg font-bold ${col.accent}`}>{msgs.length}</span>
                </div>
                <svg
                  className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-border-subtle">
                  {msgs.map((msg, i) => {
                    const c = classificationMap.get(msg.id);
                    if (!c) return null;
                    return (
                      <KanbanCard
                        key={msg.id}
                        message={msg}
                        classification={c}
                        index={i}
                        onClick={() => setSelectedId(msg.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedMsg && selectedClassification && (
        <MessageModal
          message={selectedMsg}
          classification={selectedClassification}
          onClose={() => setSelectedId(null)}
          onOverride={onOverride}
          wasOverridden={corrections?.some((c) => c.message_id === selectedMsg.id)}
        />
      )}
    </div>
  );
}

function KanbanCard({
  message,
  classification,
  index,
  onClick,
}: {
  message: RawMessage;
  classification: ClassifiedMessage;
  index: number;
  onClick: () => void;
}) {
  const senderName = getSenderName(message.from);
  const firstLine = message.body.split("\n").find((l) => l.trim()) || "";
  const preview = firstLine.length > 60 ? firstLine.slice(0, 60) + "..." : firstLine;
  const isThreat = classification.security?.is_threat;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-all card-interactive fade-in-up ${
        isThreat
          ? "border-critical/40 bg-[var(--critical-bg)]"
          : "border-border-default bg-bg-surface hover:bg-bg-elevated"
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-2.5">
        <ChannelIcon channel={message.channel} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-text-primary truncate">{senderName}</span>
            <UrgencyBadge urgency={classification.urgency} />
          </div>
          {message.subject && (
            <p className="text-[12px] font-medium text-text-secondary mt-0.5 truncate">{message.subject}</p>
          )}
          <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{preview}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-[10px] text-text-muted">{formatTime(message.timestamp)}</span>
            {classification.delegate_to && (
              <span className="text-[10px] text-warning truncate">→ {classification.delegate_to}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
