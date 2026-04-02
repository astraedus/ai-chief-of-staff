"use client";

import { useState } from "react";
import type { RawMessage, ClassifiedMessage, FilterTab, Category, Correction } from "@/lib/types";
import { MessageCard } from "./MessageCard";

interface TriageViewProps {
  messages: RawMessage[];
  classifications: ClassifiedMessage[];
  onOverride?: (messageId: number, newCategory: Category) => void;
  corrections?: Correction[];
}

const tabs: { key: FilterTab; label: string; activeColor: string }[] = [
  { key: "all", label: "All", activeColor: "text-accent-gold border-accent-gold" },
  { key: "decide", label: "Decisions", activeColor: "text-critical border-critical" },
  { key: "delegate", label: "Delegated", activeColor: "text-warning border-warning" },
  { key: "ignore", label: "Ignored", activeColor: "text-text-secondary border-text-muted" },
];

export function TriageView({ messages, classifications, onOverride, corrections }: TriageViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const classificationMap = new Map(
    classifications.map((c) => [c.id, c])
  );

  const filtered = messages.filter((msg) => {
    if (activeTab === "all") return true;
    const c = classificationMap.get(msg.id);
    return c?.category === activeTab.toUpperCase();
  });

  const counts = {
    all: messages.length,
    decide: classifications.filter((c) => c.category === "DECIDE").length,
    delegate: classifications.filter((c) => c.category === "DELEGATE").length,
    ignore: classifications.filter((c) => c.category === "IGNORE").length,
  };

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const ca = classificationMap.get(a.id);
    const cb = classificationMap.get(b.id);
    if (!ca || !cb) return 0;
    return urgencyOrder[ca.urgency] - urgencyOrder[cb.urgency];
  });

  return (
    <div className="fade-in-up" style={{ animationDelay: "150ms" }}>
      <h2 className="font-serif text-xl font-semibold text-text-primary tracking-tight mb-4">
        Message Triage
      </h2>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? tab.activeColor
                : "text-text-muted border-transparent hover:text-text-secondary hover:border-border-default"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-[11px] opacity-60">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {sorted.map((msg, i) => {
          const classification = classificationMap.get(msg.id);
          if (!classification) return null;
          const wasOverridden = corrections?.some((c) => c.message_id === msg.id);
          return (
            <MessageCard
              key={msg.id}
              message={msg}
              classification={classification}
              defaultExpanded={classification.category === "DECIDE" && activeTab === "decide"}
              index={i}
              onOverride={onOverride}
              wasOverridden={wasOverridden}
            />
          );
        })}
        {sorted.length === 0 && (
          <div className="py-10 text-center text-sm text-text-muted">
            No messages in this category.
          </div>
        )}
      </div>
    </div>
  );
}
