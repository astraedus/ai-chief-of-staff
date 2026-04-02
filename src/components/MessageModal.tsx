"use client";

import { useEffect, useCallback } from "react";
import type { RawMessage, ClassifiedMessage, Category } from "@/lib/types";
import { ChannelIcon } from "./ChannelIcon";
import { CategoryBadge, UrgencyBadge } from "./StatusBadge";

interface MessageModalProps {
  message: RawMessage;
  classification: ClassifiedMessage;
  onClose: () => void;
  onOverride?: (messageId: number, newCategory: Category) => void;
  wasOverridden?: boolean;
}

const CATEGORIES: Category[] = ["IGNORE", "DELEGATE", "DECIDE"];

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function getSenderName(from: string): string {
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from;
}

function getSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : "";
}

export function MessageModal({
  message,
  classification,
  onClose,
  onOverride,
  wasOverridden,
}: MessageModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const senderName = getSenderName(message.from);
  const senderEmail = getSenderEmail(message.from);
  const isThreat = classification.security?.is_threat;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-border-default bg-bg-surface shadow-2xl fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-surface/95 backdrop-blur-sm border-b border-border-subtle px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <ChannelIcon channel={message.channel} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-text-primary">{senderName}</span>
                  {senderEmail && (
                    <span className="font-mono text-[11px] text-text-muted truncate">{senderEmail}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {message.channel_name && (
                    <span className="font-mono text-[11px] text-text-muted">{message.channel_name}</span>
                  )}
                  <span className="font-mono text-[11px] text-text-muted">
                    {formatDate(message.timestamp)} {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.subject && (
                  <p className="text-sm font-medium text-text-primary mt-1">{message.subject}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UrgencyBadge urgency={classification.urgency} />
              <CategoryBadge category={classification.category} />
              <button
                onClick={onClose}
                className="ml-1 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Security warning */}
          {isThreat && (
            <div className="flex items-start gap-2.5 rounded-lg bg-[var(--critical-bg)] border border-[var(--critical-border)] p-4">
              <svg className="h-5 w-5 text-critical shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-semibold text-sm text-critical">
                  Security Threat: {classification.security.threat_type}
                </p>
                <p className="text-[13px] text-text-secondary mt-0.5">{classification.security.details}</p>
              </div>
            </div>
          )}

          {/* Message body */}
          <div>
            <SectionLabel>Message</SectionLabel>
            <div className="text-[13px] text-text-primary whitespace-pre-wrap bg-bg-elevated rounded-lg p-4 leading-relaxed border border-border-subtle">
              {message.body}
            </div>
          </div>

          {/* AI Reasoning */}
          <div>
            <SectionLabel>AI Reasoning</SectionLabel>
            <p className="text-[13px] text-text-secondary italic leading-relaxed">{classification.reasoning}</p>
          </div>

          {/* Delegate to */}
          {classification.delegate_to && (
            <div>
              <SectionLabel>Delegate To</SectionLabel>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--warning-bg)] border border-[var(--warning-border)] px-3 py-1.5 text-sm font-medium text-warning">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {classification.delegate_to}
              </span>
            </div>
          )}

          {/* Drafted response + send */}
          {classification.drafted_response && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <SectionLabel>Drafted Response</SectionLabel>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-gold px-3 py-1.5 text-[11px] font-semibold text-text-inverse uppercase tracking-wider hover:bg-accent-gold-bright transition-colors"
                  title="Send response (not connected in demo)"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  Send
                </button>
              </div>
              <div className="text-[13px] text-text-primary whitespace-pre-wrap rounded-lg border border-[var(--info-border)] bg-[var(--info-bg)] p-4 leading-relaxed">
                {classification.drafted_response}
              </div>
            </div>
          )}

          {/* Reclassify */}
          {onOverride && (
            <div className="border-t border-border-subtle pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>
                    Classification {wasOverridden && <span className="text-accent-gold">(corrected)</span>}
                  </SectionLabel>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Override this if the AI got it wrong — your correction improves future results.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onOverride(message.id, cat);
                    }}
                    className={`rounded-lg px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all ${
                      classification.category === cat
                        ? "bg-accent-gold text-text-inverse shadow-sm"
                        : "bg-bg-elevated text-text-secondary border border-border-default hover:border-border-strong hover:text-text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-1.5">
      {children}
    </p>
  );
}
