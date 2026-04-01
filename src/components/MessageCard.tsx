"use client";

import { useState } from "react";
import type { RawMessage, ClassifiedMessage } from "@/lib/types";
import { ChannelIcon } from "./ChannelIcon";
import { CategoryBadge, UrgencyBadge } from "./StatusBadge";

interface MessageCardProps {
  message: RawMessage;
  classification: ClassifiedMessage;
  defaultExpanded?: boolean;
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getSenderName(from: string): string {
  // "Sarah Chen <sarah.chen@meridianventures.com>" -> "Sarah Chen"
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from;
}

export function MessageCard({
  message,
  classification,
  defaultExpanded = false,
}: MessageCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const senderName = getSenderName(message.from);
  const firstLine = message.body.split("\n").find((l) => l.trim().length > 0) || "";
  const summary = firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;

  const isThreat = classification.security?.is_threat;

  return (
    <div
      className={`rounded-lg border bg-white transition-all ${
        isThreat
          ? "border-red-300 ring-1 ring-red-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Header row -- always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <ChannelIcon channel={message.channel} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900">
              {senderName}
            </span>
            {message.channel_name && (
              <span className="text-xs text-gray-400">{message.channel_name}</span>
            )}
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          </div>
          {message.subject && (
            <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">
              {message.subject}
            </p>
          )}
          {!expanded && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{summary}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <UrgencyBadge urgency={classification.urgency} />
          <CategoryBadge category={classification.category} />
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 fade-in-up">
          {/* Security warning */}
          {isThreat && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm">
              <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-semibold text-red-800">
                  Security Threat: {classification.security.threat_type}
                </p>
                <p className="text-red-700 mt-0.5">{classification.security.details}</p>
              </div>
            </div>
          )}

          {/* Full message body */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Message
            </p>
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md p-3 leading-relaxed">
              {message.body}
            </div>
          </div>

          {/* AI Reasoning */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              AI Reasoning
            </p>
            <p className="text-sm text-gray-600 italic">{classification.reasoning}</p>
          </div>

          {/* Delegate to */}
          {classification.delegate_to && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Delegate To
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-800">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {classification.delegate_to}
              </span>
            </div>
          )}

          {/* Drafted response */}
          {classification.drafted_response && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Drafted Response
              </p>
              <div className="text-sm text-gray-700 whitespace-pre-wrap rounded-md border border-blue-200 bg-blue-50/50 p-3 leading-relaxed">
                {classification.drafted_response}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
