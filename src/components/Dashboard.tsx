"use client";

import { useState, useCallback } from "react";
import type { RawMessage, TriageResult, ProcessingStatus } from "@/lib/types";
import { Briefing } from "./Briefing";
import { Flags } from "./Flags";
import { TriageView } from "./TriageView";
import { UploadData } from "./UploadData";
import { ProcessingOverlay } from "./ProcessingOverlay";
import defaultMessages from "@/data/messages.json";

export function Dashboard() {
  const [messages, setMessages] = useState<RawMessage[]>(defaultMessages as RawMessage[]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "idle",
    progress: 0,
    message: "",
  });

  const runTriage = useCallback(async (msgs: RawMessage[]) => {
    setMessages(msgs);
    setResult(null);

    try {
      // Pass 1
      setStatus({
        stage: "classifying",
        progress: 20,
        message: "Classifying messages...",
      });

      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || `HTTP ${response.status}`);
      }

      // We get the full result from a single API call
      // but show progress stages for UX
      setStatus({
        stage: "cross_referencing",
        progress: 70,
        message: "Cross-referencing and generating briefing...",
      });

      const data: TriageResult = await response.json();

      // Brief delay so the user sees the cross-referencing stage
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

  // Stats bar
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
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">AI Chief of Staff</h1>
                <p className="text-xs text-gray-500">{today}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UploadData onUpload={handleUpload} isProcessing={isProcessing} />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        {/* Pre-triage state: show the action prompt */}
        {!result && status.stage === "idle" && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Ready to triage your morning
            </h2>
            <p className="text-sm text-gray-500 mt-2 mb-6 max-w-md mx-auto">
              Process {messages.length} messages across email, Slack, and WhatsApp.
              The AI will classify each message, detect cross-thread relationships,
              and generate your executive briefing.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleProcessDefault}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Process Messages
              </button>
              <span className="text-xs text-gray-400">or upload your own</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatCard
                  label="Decisions Needed"
                  value={stats.decide}
                  color="text-red-700"
                  bg="bg-red-50"
                  border="border-red-200"
                />
                <StatCard
                  label="Delegated"
                  value={stats.delegate}
                  color="text-amber-700"
                  bg="bg-amber-50"
                  border="border-amber-200"
                />
                <StatCard
                  label="Flagged"
                  value={stats.flags}
                  color="text-orange-700"
                  bg="bg-orange-50"
                  border="border-orange-200"
                />
                <StatCard
                  label="Critical"
                  value={stats.critical}
                  color="text-red-700"
                  bg="bg-red-50"
                  border="border-red-200"
                />
                <StatCard
                  label="Ignored"
                  value={stats.ignore}
                  color="text-gray-600"
                  bg="bg-gray-50"
                  border="border-gray-200"
                />
              </div>
            )}

            {/* Briefing */}
            <Briefing briefing={result.briefing} />

            {/* Flags */}
            <Flags flags={result.flags} />

            {/* Triage view */}
            <TriageView messages={messages} classifications={result.classifications} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs text-gray-400 text-center">
            AI Chief of Staff &middot; Powered by Gemini 2.5 Flash &middot; Two-pass triage pipeline
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
  border,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-lg border ${border} ${bg} px-4 py-3`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
