import { NextRequest, NextResponse } from "next/server";
import { runTriagePipeline } from "@/lib/triage";
import { saveTriageSession, getCorrections } from "@/lib/db";
import type { RawMessage } from "@/lib/types";

// Validate a message has required fields
function isValidMessage(msg: unknown): msg is RawMessage {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return (
    typeof m.id === "number" &&
    typeof m.channel === "string" &&
    ["email", "slack", "whatsapp"].includes(m.channel as string) &&
    typeof m.from === "string" &&
    typeof m.timestamp === "string" &&
    typeof m.body === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either { messages: [...] } or a raw array
    const rawMessages: unknown[] = Array.isArray(body)
      ? body
      : Array.isArray(body.messages)
        ? body.messages
        : null;

    if (!rawMessages || rawMessages.length === 0) {
      return NextResponse.json(
        {
          error:
            "Request body must be a JSON array of messages or an object with a 'messages' field.",
        },
        { status: 400 }
      );
    }

    // Validate each message
    const invalidIndices: number[] = [];
    const validMessages: RawMessage[] = [];

    for (let i = 0; i < rawMessages.length; i++) {
      const msg = rawMessages[i];
      if (isValidMessage(msg)) {
        validMessages.push(msg);
      } else {
        invalidIndices.push(i);
      }
    }

    if (validMessages.length === 0) {
      return NextResponse.json(
        {
          error: "No valid messages found in the request.",
          invalid_indices: invalidIndices,
        },
        { status: 400 }
      );
    }

    // Load corrections from DB, fall back to request body
    let corrections = await getCorrections();
    if (corrections.length === 0 && Array.isArray(body.corrections)) {
      corrections = body.corrections;
    }

    // Determine source: 'sample' if messages match default count, else 'upload'
    const source = body.source || "sample";

    const result = await runTriagePipeline(validMessages, corrections);

    // Persist to Supabase (fire-and-forget style -- don't block response)
    let sessionId: string | null = null;
    try {
      sessionId = await saveTriageSession(result, validMessages, source);
    } catch (err) {
      console.error("Non-critical: failed to persist session:", err);
    }

    return NextResponse.json({
      ...result,
      session_id: sessionId,
      warnings:
        invalidIndices.length > 0
          ? `${invalidIndices.length} message(s) were skipped due to invalid format.`
          : undefined,
    });
  } catch (err) {
    console.error("Triage pipeline error:", err);

    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: "Triage pipeline failed", details: message },
      { status: 500 }
    );
  }
}
