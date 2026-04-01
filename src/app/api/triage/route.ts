import { NextRequest, NextResponse } from "next/server";
import { runTriagePipeline } from "@/lib/triage";
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

    const result = await runTriagePipeline(validMessages);

    return NextResponse.json({
      ...result,
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
