import { describe, it, expect } from "vitest";
import rawMessages from "@/data/messages.json";

// Cast to any[] to avoid TS inference issues with JSON imports
const messages = rawMessages as Record<string, unknown>[];

describe("Sample messages.json", () => {
  it("contains exactly 20 messages", () => {
    expect(messages).toHaveLength(20);
  });

  it("has unique IDs for every message", () => {
    const ids = messages.map((m) => m.id as number);
    const unique = new Set(ids);
    expect(unique.size).toBe(messages.length);
  });

  it("has sequential IDs from 1 to 20", () => {
    const ids = messages.map((m) => m.id as number).sort((a, b) => a - b);
    expect(ids[0]).toBe(1);
    expect(ids[ids.length - 1]).toBe(20);
  });

  it("only contains valid channels", () => {
    const validChannels = ["email", "slack", "whatsapp"];
    for (const msg of messages) {
      expect(validChannels).toContain(msg.channel);
    }
  });

  it("every message has a non-empty body", () => {
    for (const msg of messages) {
      expect((msg.body as string).length).toBeGreaterThan(0);
    }
  });

  it("every message has a valid ISO timestamp", () => {
    for (const msg of messages) {
      const date = new Date(msg.timestamp as string);
      expect(date.toString()).not.toBe("Invalid Date");
    }
  });

  it("all messages are from the same day", () => {
    const dates = messages.map(
      (m) => new Date(m.timestamp as string).toISOString().split("T")[0]
    );
    const unique = new Set(dates);
    expect(unique.size).toBe(1);
    expect(dates[0]).toBe("2026-03-18");
  });

  it("email messages have subject and to fields", () => {
    const emails = messages.filter((m) => m.channel === "email");
    expect(emails.length).toBeGreaterThan(0);
    for (const email of emails) {
      expect(email.subject).toBeDefined();
      expect(email.to).toBeDefined();
    }
  });

  it("contains the phishing message (id 4)", () => {
    const phishing = messages.find((m) => m.id === 4);
    expect(phishing).toBeDefined();
    expect(phishing!.body as string).toContain("seczure-verify.com");
  });

  it("contains the payment crisis thread (ids 2, 9, 16)", () => {
    const threadIds = [2, 9, 16];
    for (const id of threadIds) {
      const msg = messages.find((m) => m.id === id);
      expect(msg).toBeDefined();
      expect(msg!.from as string).toContain("tom.bradley");
    }
  });

  it("contains the Northwind deal messages (ids 12, 19)", () => {
    const deal = messages.find((m) => m.id === 12);
    const renegotiation = messages.find((m) => m.id === 19);
    expect(deal).toBeDefined();
    expect(renegotiation).toBeDefined();
    expect(deal!.body as string).toContain("120k");
    expect(renegotiation!.body as string).toContain("60k");
  });
});
