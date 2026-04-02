"use client";

import type { ProcessingStatus } from "@/lib/types";

interface ProcessingOverlayProps {
  status: ProcessingStatus;
}

export function ProcessingOverlay({ status }: ProcessingOverlayProps) {
  if (status.stage === "idle" || status.stage === "complete") return null;

  if (status.stage === "error") {
    return (
      <div className="rounded-xl border border-[var(--critical-border)] bg-[var(--critical-bg)] p-8 text-center fade-in-up">
        <svg className="mx-auto h-8 w-8 text-critical mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-sm font-semibold text-critical">Processing failed</p>
        <p className="text-[13px] text-text-secondary mt-1.5">{status.message}</p>
      </div>
    );
  }

  const stageLabels = {
    classifying: "Pass 1 — Classifying messages individually",
    cross_referencing: "Pass 2 — Cross-referencing threads, detecting conflicts",
  };

  const label = stageLabels[status.stage as keyof typeof stageLabels] || status.message;

  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-10 text-center fade-in-up">
      {/* Animated rings */}
      <div className="mx-auto mb-6 relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-border-subtle" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-gold"
          style={{ animation: "spin 1.2s linear infinite" }}
        />
        <div
          className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-accent-gold-bright"
          style={{ animation: "spin 1.8s linear infinite reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-accent-gold glow-pulse" />
        </div>
      </div>

      <p className="font-mono text-[11px] font-bold text-accent-gold uppercase tracking-[0.2em]">
        Processing
      </p>
      <p className="text-sm text-text-secondary mt-2">{label}</p>

      {/* Progress bar */}
      <div className="mt-6 mx-auto max-w-xs">
        <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-gold to-accent-gold-bright transition-all duration-700 ease-out progress-pulse"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <p className="font-mono mt-2.5 text-[11px] text-text-muted tracking-wider">
          {status.progress}% complete
        </p>
      </div>

      <p className="mt-4 text-[11px] text-text-muted">
        Two-pass analysis may take up to 60 seconds
      </p>
    </div>
  );
}
