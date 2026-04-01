import { describe, it, expect } from "vitest";
import type { RawMessage } from "@/lib/types";

// Re-implement the validation function from the API route for testing
// (mirrors src/app/api/triage/route.ts isValidMessage)
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

describe("Message Validation", () => {
  it("accepts a valid email message", () => {
    const msg = {
      id: 1,
      channel: "email",
      from: "Sarah Chen <sarah@example.com>",
      to: "ceo@company.com",
      subject: "Follow-up",
      timestamp: "2026-03-18T08:12:00Z",
      body: "Hello, following up on our conversation.",
    };
    expect(isValidMessage(msg)).toBe(true);
  });

  it("accepts a valid slack message", () => {
    const msg = {
      id: 2,
      channel: "slack",
      from: "tom.bradley",
      channel_name: "#engineering",
      timestamp: "2026-03-18T08:34:00Z",
      body: "heads up - the API migration is about 60% done.",
    };
    expect(isValidMessage(msg)).toBe(true);
  });

  it("accepts a valid whatsapp message", () => {
    const msg = {
      id: 3,
      channel: "whatsapp",
      from: "James (COO)",
      timestamp: "2026-03-18T08:45:00Z",
      body: "Morning. Quick one.",
    };
    expect(isValidMessage(msg)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidMessage(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isValidMessage(undefined)).toBe(false);
  });

  it("rejects a string", () => {
    expect(isValidMessage("not a message")).toBe(false);
  });

  it("rejects message with missing id", () => {
    expect(
      isValidMessage({
        channel: "email",
        from: "test@test.com",
        timestamp: "2026-01-01T00:00:00Z",
        body: "test",
      })
    ).toBe(false);
  });

  it("rejects message with invalid channel", () => {
    expect(
      isValidMessage({
        id: 1,
        channel: "telegram",
        from: "test",
        timestamp: "2026-01-01T00:00:00Z",
        body: "test",
      })
    ).toBe(false);
  });

  it("rejects message with missing body", () => {
    expect(
      isValidMessage({
        id: 1,
        channel: "email",
        from: "test@test.com",
        timestamp: "2026-01-01T00:00:00Z",
      })
    ).toBe(false);
  });

  it("rejects message with non-string timestamp", () => {
    expect(
      isValidMessage({
        id: 1,
        channel: "email",
        from: "test@test.com",
        timestamp: 12345,
        body: "test",
      })
    ).toBe(false);
  });

  it("accepts message without optional fields (to, subject, channel_name)", () => {
    const msg = {
      id: 10,
      channel: "whatsapp",
      from: "Someone",
      timestamp: "2026-03-18T10:00:00Z",
      body: "A simple message",
    };
    expect(isValidMessage(msg)).toBe(true);
  });
});
