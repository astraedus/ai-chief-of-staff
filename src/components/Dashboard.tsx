"use client";

import { useState, useCallback } from "react";
import type { RawMessage, TriageResult, ProcessingStatus, Correction, Category } from "@/lib/types";
import { Briefing } from "./Briefing";
import { Flags } from "./Flags";
import { TriageView } from "./TriageView";
import { UploadData } from "./UploadData";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { ThemeToggle } from "./ThemeToggle";
import defaultMessages from "@/data/messages.json";

export function Dashboard() {
  const [messages, setMessages] = useState<RawMessage[]>(defaultMessages as RawMessage[]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "idle",
    progress: 0,
    message: "",
  });
  const [corrections, setCorrections] = useState<Correction[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("corrections");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const handleOverride = useCallback(
    (messageId: number, newCategory: Category) => {
      if (!result) return;
      const original = result.classifications.find((c) => c.id === messageId);
      if (!original || original.category === newCategory) return;

      const msg = messages.find((m) => m.id === messageId);
      const summary = msg?.body.split("\n").find((l) => l.trim())?.slice(0, 80) || `Message #${messageId}`;

      const correction: Correction = {
        message_id: messageId,
        original_category: original.category,
        corrected_category: newCategory,
        message_summary: summary,
        timestamp: new Date().toISOString(),
      };

      // Update classification in place
      const updatedClassifications = result.classifications.map((c) =>
        c.id === messageId ? { ...c, category: newCategory } : c
      );
      setResult({ ...result, classifications: updatedClassifications });

      // Store correction
      const updated = [...corrections, correction];
      setCorrections(updated);
      localStorage.setItem("corrections", JSON.stringify(updated));
    },
    [result, messages, corrections]
  );

  const runTriage = useCallback(async (msgs: RawMessage[]) => {
    setMessages(msgs);
    setResult(null);

    try {
      setStatus({
        stage: "classifying",
        progress: 20,
        message: "Classifying messages...",
      });

      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, corrections }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || `HTTP ${response.status}`);
      }

      setStatus({
        stage: "cross_referencing",
        progress: 70,
        message: "Cross-referencing and generating briefing...",
      });

      const data: TriageResult = await response.json();

      await new Promise((r) => setTimeout(r, 500));

      setResult(data);
      setStatus({
        stage: "complete",
        progress: 100,
        message: "Complete",
      });
    } catch (err) {
      setStatus({
        stage: "error",
        progress: 0,
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    }
  }, []);

  const handleUpload = useCallback(
    (uploaded: unknown[]) => {
      runTriage(uploaded as RawMessage[]);
    },
    [runTriage]
  );

  const handleProcessDefault = useCallback(() => {
    runTriage(defaultMessages as RawMessage[]);
  }, [runTriage]);

  const isProcessing = status.stage === "classifying" || status.stage === "cross_referencing";

  const stats = result
    ? {
        decide: result.classifications.filter((c) => c.category === "DECIDE").length,
        delegate: result.classifications.filter((c) => c.category === "DELEGATE").length,
        ignore: result.classifications.filter((c) => c.category === "IGNORE").length,
        flags: result.flags.length,
        critical: result.flags.filter((f) => f.severity === "critical").length,
      }
    : null;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-surface/85 backdrop-blur-xl header-glow">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-gold-dim)] border border-[var(--accent-gold)]/20">
                <svg className="h-4.5 w-4.5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold tracking-tight text-text-primary">
                  AI Chief of Staff
                </h1>
                <p className="font-mono text-[11px] text-text-muted tracking-wide uppercase">{today}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UploadData onUpload={handleUpload} isProcessing={isProcessing} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
        {/* Pre-triage state */}
        {!result && status.stage === "idle" && (
          <div className="fade-in-up rounded-xl border border-border-default bg-bg-surface p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-gold-dim)] border border-[var(--accent-gold)]/15">
              <svg className="h-8 w-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-text-primary tracking-tight">
              Ready to triage your morning
            </h2>
            <p className="text-sm text-text-secondary mt-3 mb-8 max-w-md mx-auto leading-relaxed">
              Process {messages.length} messages across email, Slack, and WhatsApp.
              The AI will classify, cross-reference threads, and generate your executive briefing.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleProcessDefault}
                className="group inline-flex items-center gap-2.5 rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-text-inverse shadow-lg shadow-[var(--accent-gold)]/15 hover:bg-accent-gold-bright transition-all duration-200"
              >
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Process Messages
              </button>
              <span className="text-sm text-text-secondary">or upload your own data</span>
            </div>
          </div>
        )}

        {/* Processing state */}
        {(status.stage === "classifying" || status.stage === "cross_referencing" || status.stage === "error") && (
          <ProcessingOverlay status={status} />
        )}

        {/* Results */}
        {result && (
          <>
            {/* Stats bar */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 fade-in-up">
                <StatCard label="Decisions" value={stats.decide} accent="critical" />
                <StatCard label="Delegated" value={stats.delegate} accent="warning" />
                <StatCard label="Flagged" value={stats.flags} accent="gold" />
                <StatCard label="Critical" value={stats.critical} accent="critical" />
                <StatCard label="Ignored" value={stats.ignore} accent="muted" />
              </div>
            )}

            <Briefing briefing={result.briefing} />
            <Flags flags={result.flags} />
            <TriageView messages={messages} classifications={result.classifications} onOverride={handleOverride} corrections={corrections} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-5 mt-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between">
          <p className="font-mono text-[11px] text-text-muted tracking-wider uppercase">
            AI Chief of Staff
          </p>
          <p className="font-mono text-[11px] text-text-muted tracking-wider">
            Gemini 2.5 Flash &middot; Two-pass pipeline
          </p>
        </div>
      </footer>
    </div>
  );
}

type AccentType = "critical" | "warning" | "gold" | "muted";

function StatCard({ label, value, accent }: { label: string; value: number; accent: AccentType }) {
  const styles: Record<AccentType, { num: string; bg: string; border: string }> = {
    critical: { num: "text-critical", bg: "bg-[var(--critical-bg)]", border: "border-[var(--critical-border)]" },
    warning: { num: "text-warning", bg: "bg-[var(--warning-bg)]", border: "border-[var(--warning-border)]" },
    gold: { num: "text-accent-gold", bg: "bg-[var(--accent-gold-dim)]", border: "border-[var(--accent-gold)]/20" },
    muted: { num: "text-text-secondary", bg: "bg-bg-elevated", border: "border-border-default" },
  };
  const s = styles[accent];

  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} px-4 py-3`}>
      <p className={`font-serif text-2xl font-bold ${s.num}`}>{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wider font-medium">{label}</p>
    </div>
  );
}
