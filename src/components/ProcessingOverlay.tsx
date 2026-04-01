"use client";

import type { ProcessingStatus } from "@/lib/types";

interface ProcessingOverlayProps {
  status: ProcessingStatus;
}

export function ProcessingOverlay({ status }: ProcessingOverlayProps) {
  if (status.stage === "idle" || status.stage === "complete") return null;

  if (status.stage === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <svg className="mx-auto h-8 w-8 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-sm font-medium text-red-800">Processing failed</p>
        <p className="text-sm text-red-600 mt-1">{status.message}</p>
      </div>
    );
  }

  const stageLabels = {
    classifying: "Pass 1: Classifying messages individually...",
    cross_referencing: "Pass 2: Cross-referencing threads, detecting conflicts, generating briefing...",
  };

  const label = stageLabels[status.stage as keyof typeof stageLabels] || status.message;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      {/* Spinner */}
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

      <p className="text-sm font-medium text-gray-900">{label}</p>

      {/* Progress bar */}
      <div className="mt-4 mx-auto max-w-xs">
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-500 ease-out progress-pulse"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">{status.progress}% complete</p>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        This typically takes 15-30 seconds depending on message count.
      </p>
    </div>
  );
}
