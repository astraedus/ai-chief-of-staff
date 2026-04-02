"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  RawMessage,
  TriageResult,
  ProcessingStatus,
  Correction,
  Category,
} from "@/lib/types";
import { Briefing } from "./Briefing";
import { Flags } from "./Flags";
import { TriageView } from "./TriageView";
import { UploadData } from "./UploadData";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { ThemeToggle } from "./ThemeToggle";
import defaultMessages from "@/data/messages.json";

interface SessionSummary {
  id: string;
  created_at: string;
  message_count: number;
  source: string;
}

export function Dashboard() {
  const [messages, setMessages] = useState<RawMessage[]>(
    defaultMessages as RawMessage[]
  );
  const [result, setResult] = useState<TriageResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "idle",
    progress: 0,
    message: "",
  });
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Load recent sessions on mount
  useEffect(() => {
    fetch("/api/sessions?limit=10")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      })
      .catch(() => {
        // Supabase unavailable -- graceful degradation
      });
  }, []);

  // Close history dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node)
      ) {
        setHistoryOpen(false);
      }
    }
    if (historyOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [historyOpen]);

  const loadSession = useCallback(async (id: string) => {
    setLoadingSession(true);
    setHistoryOpen(false);
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) throw new Error("Failed to load session");
      const session = await res.json();

      // Reconstruct TriageResult and messages from the stored session
      const loadedMessages: RawMessage[] = session.classifications.map(
        (c: { original_message: RawMessage }) => c.original_message
      );
      const loadedResult: TriageResult = {
        classifications: session.classifications.map(
          (c: {
            id: number;
            category: Category;
            urgency: string;
            reasoning: string;
            drafted_response: string | null;
            delegate_to: string | null;
            security: { is_threat: boolean; threat_type: string | null; details: string | null };
          }) => ({
            id: c.id,
            category: c.category,
            urgency: c.urgency,
            reasoning: c.reasoning,
            drafted_response: c.drafted_response,
            delegate_to: c.delegate_to,
            security: c.security,
          })
        ),
        threads: session.threads || [],
        flags: session.flags || [],
        briefing: session.briefing,
        processed_at: session.created_at,
        message_count: session.message_count,
      };

      setMessages(loadedMessages);
      setResult(loadedResult);
      setSessionId(id);
      setStatus({ stage: "complete", progress: 100, message: "Loaded from history" });
    } catch {
      // If loading fails, do nothing -- user can try again or process fresh
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const handleOverride = useCallback(
    (messageId: number, newCategory: Category) => {
      if (!result) return;
      const original = result.classifications.find((c) => c.id === messageId);
      if (!original || original.category === newCategory) return;

      const msg = messages.find((m) => m.id === messageId);
      const summary =
        msg?.body
          .split("\n")
          .find((l) => l.trim())
          ?.slice(0, 80) || `Message #${messageId}`;

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

      // Store correction locally
      const updated = [...corrections, correction];
      setCorrections(updated);

      // POST correction to Supabase (fire-and-forget)
      fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          ...correction,
        }),
      }).catch(() => {
        // Supabase unavailable -- correction stored in local state only
      });
    },
    [result, messages, corrections, sessionId]
  );

  const runTriage = useCallback(
    async (msgs: RawMessage[], source: string = "sample") => {
      setMessages(msgs);
      setResult(null);
      setSessionId(null);

      try {
        setStatus({
          stage: "classifying",
          progress: 20,
          message: "Classifying messages...",
        });

        const response = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs, corrections, source }),
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

        const data = await response.json();
        const { session_id, warnings, ...triageResult } = data;

        await new Promise((r) => setTimeout(r, 500));

        setResult(triageResult as TriageResult);
        setSessionId(session_id || null);
        setStatus({
          stage: "complete",
          progress: 100,
          message: "Complete",
        });

        // Refresh sessions list after a new session is created
        if (session_id) {
          fetch("/api/sessions?limit=10")
            .then((r) => r.json())
            .then((d) => {
              if (Array.isArray(d.sessions)) setSessions(d.sessions);
            })
            .catch(() => {});
        }

        if (warnings) {
          console.warn("Triage warnings:", warnings);
        }
      } catch (err) {
        setStatus({
          stage: "error",
          progress: 0,
          message:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred.",
        });
      }
    },
    [corrections]
  );

  const handleUpload = useCallback(
    (uploaded: unknown[]) => {
      runTriage(uploaded as RawMessage[], "upload");
    },
    [runTriage]
  );

  const handleProcessDefault = useCallback(() => {
    runTriage(defaultMessages as RawMessage[], "sample");
  }, [runTriage]);

  const isProcessing =
    status.stage === "classifying" || status.stage === "cross_referencing";

  const stats = result
    ? {
        decide: result.classifications.filter((c) => c.category === "DECIDE")
          .length,
        delegate: result.classifications.filter(
          (c) => c.category === "DELEGATE"
        ).length,
        ignore: result.classifications.filter((c) => c.category === "IGNORE")
          .length,
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
                <svg
                  className="h-4.5 w-4.5 text-accent-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold tracking-tight text-text-primary">
                  AI Chief of Staff
                </h1>
                <p className="font-mono text-[11px] text-text-muted tracking-wide uppercase">
                  {today}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* History dropdown */}
              {sessions.length > 0 && (
                <div className="relative" ref={historyRef}>
                  <button
                    onClick={() => setHistoryOpen(!historyOpen)}
                    disabled={loadingSession}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors duration-150"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    History
                    <svg
                      className={`h-3 w-3 transition-transform duration-150 ${historyOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>

                  {historyOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 rounded-lg border border-border-default bg-bg-surface shadow-lg shadow-black/10 overflow-hidden z-30 fade-in">
                      <div className="px-3 py-2 border-b border-border-subtle">
                        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                          Recent Sessions
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {sessions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => loadSession(s.id)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-bg-elevated transition-colors duration-100 border-b border-border-subtle last:border-b-0 ${sessionId === s.id ? "bg-[var(--accent-gold-dim)]" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-text-primary">
                                {s.message_count} messages
                              </span>
                              <span
                                className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  s.source === "upload"
                                    ? "text-info bg-[var(--info-bg)]"
                                    : "text-text-muted bg-bg-elevated"
                                }`}
                              >
                                {s.source}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {formatSessionDate(s.created_at)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <UploadData onUpload={handleUpload} isProcessing={isProcessing} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
        {/* Loading session overlay */}
        {loadingSession && (
          <div className="rounded-xl border border-border-default bg-bg-surface p-12 text-center fade-in">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
            <p className="text-sm text-text-secondary">Loading session...</p>
          </div>
        )}

        {/* Pre-triage state */}
        {!result && status.stage === "idle" && !loadingSession && (
          <div className="fade-in-up rounded-xl border border-border-default bg-bg-surface p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-gold-dim)] border border-[var(--accent-gold)]/15">
              <svg
                className="h-8 w-8 text-accent-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-text-primary tracking-tight">
              Ready to triage your morning
            </h2>
            <p className="text-sm text-text-secondary mt-3 mb-8 max-w-md mx-auto leading-relaxed">
              Process {messages.length} messages across email, Slack, and
              WhatsApp. The AI will classify, cross-reference threads, and
              generate your executive briefing.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleProcessDefault}
                className="group inline-flex items-center gap-2.5 rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-text-inverse shadow-lg shadow-[var(--accent-gold)]/15 hover:bg-accent-gold-bright transition-all duration-200"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                  />
                </svg>
                Process Messages
              </button>
              <span className="text-sm text-text-secondary">
                or upload your own data
              </span>
            </div>
            {sessions.length > 0 && (
              <p className="text-xs text-text-muted mt-6">
                You have {sessions.length} past session
                {sessions.length !== 1 ? "s" : ""}. Click{" "}
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="text-accent-gold hover:text-accent-gold-bright underline underline-offset-2"
                >
                  History
                </button>{" "}
                to load one.
              </p>
            )}
          </div>
        )}

        {/* Processing state */}
        {(status.stage === "classifying" ||
          status.stage === "cross_referencing" ||
          status.stage === "error") && <ProcessingOverlay status={status} />}

        {/* Results */}
        {result && !loadingSession && (
          <>
            {/* Stats bar */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 fade-in-up">
                <StatCard
                  label="Decisions"
                  value={stats.decide}
                  accent="critical"
                />
                <StatCard
                  label="Delegated"
                  value={stats.delegate}
                  accent="warning"
                />
                <StatCard
                  label="Flagged"
                  value={stats.flags}
                  accent="gold"
                />
                <StatCard
                  label="Critical"
                  value={stats.critical}
                  accent="critical"
                />
                <StatCard
                  label="Ignored"
                  value={stats.ignore}
                  accent="muted"
                />
              </div>
            )}

            <Briefing briefing={result.briefing} />
            <Flags flags={result.flags} />
            <TriageView
              messages={messages}
              classifications={result.classifications}
              onOverride={handleOverride}
              corrections={corrections}
            />
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: AccentType;
}) {
  const styles: Record<
    AccentType,
    { num: string; bg: string; border: string }
  > = {
    critical: {
      num: "text-critical",
      bg: "bg-[var(--critical-bg)]",
      border: "border-[var(--critical-border)]",
    },
    warning: {
      num: "text-warning",
      bg: "bg-[var(--warning-bg)]",
      border: "border-[var(--warning-border)]",
    },
    gold: {
      num: "text-accent-gold",
      bg: "bg-[var(--accent-gold-dim)]",
      border: "border-[var(--accent-gold)]/20",
    },
    muted: {
      num: "text-text-secondary",
      bg: "bg-bg-elevated",
      border: "border-border-default",
    },
  };
  const s = styles[accent];

  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} px-4 py-3`}>
      <p className={`font-serif text-2xl font-bold ${s.num}`}>{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wider font-medium">
        {label}
      </p>
    </div>
  );
}

function formatSessionDate(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
