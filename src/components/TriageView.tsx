"use client";

import { useState } from "react";
import type { RawMessage, ClassifiedMessage, FilterTab } from "@/lib/types";
import { MessageCard } from "./MessageCard";

interface TriageViewProps {
  messages: RawMessage[];
  classifications: ClassifiedMessage[];
}

const tabs: { key: FilterTab; label: string; color: string }[] = [
  { key: "all", label: "All", color: "text-gray-900 border-gray-900" },
  { key: "decide", label: "Decisions", color: "text-red-700 border-red-600" },
  { key: "delegate", label: "Delegated", color: "text-amber-700 border-amber-500" },
  { key: "ignore", label: "Ignored", color: "text-gray-500 border-gray-400" },
];

export function TriageView({ messages, classifications }: TriageViewProps) {
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

  // Sort: critical urgency first
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const ca = classificationMap.get(a.id);
    const cb = classificationMap.get(b.id);
    if (!ca || !cb) return 0;
    return urgencyOrder[ca.urgency] - urgencyOrder[cb.urgency];
  });

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">Message Triage</h2>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? tab.color
                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="space-y-2">
        {sorted.map((msg) => {
          const classification = classificationMap.get(msg.id);
          if (!classification) return null;
          return (
            <MessageCard
              key={msg.id}
              message={msg}
              classification={classification}
              defaultExpanded={classification.category === "DECIDE" && activeTab === "decide"}
            />
          );
        })}
        {sorted.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            No messages in this category.
          </div>
        )}
      </div>
    </div>
  );
}
