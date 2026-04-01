import { describe, it, expect } from "vitest";
import { buildClassificationPrompt, buildCrossReferencePrompt } from "@/lib/prompts";
import type { RawMessage, ClassifiedMessage } from "@/lib/types";

const sampleMessages: RawMessage[] = [
  {
    id: 1,
    channel: "email",
    from: "investor@vc.com",
    to: "ceo@company.com",
    subject: "Series B",
    timestamp: "2026-03-18T08:12:00Z",
    body: "Let's discuss the term sheet.",
  },
  {
    id: 2,
    channel: "slack",
    from: "engineer",
    channel_name: "#engineering",
    timestamp: "2026-03-18T09:00:00Z",
    body: "Deploy is done.",
  },
  {
    id: 3,
    channel: "whatsapp",
    from: "Mum",
    timestamp: "2026-03-18T09:30:00Z",
    body: "Dinner on Sunday?",
  },
];

const sampleClassifications: ClassifiedMessage[] = [
  {
    id: 1,
    category: "DECIDE",
    urgency: "high",
    reasoning: "Investor communication requires CEO involvement.",
    drafted_response: "Thanks, let's set up a call.",
    delegate_to: null,
    security: { is_threat: false, threat_type: null, details: null },
  },
  {
    id: 2,
    category: "IGNORE",
    urgency: "low",
    reasoning: "FYI update, no action needed.",
    drafted_response: null,
    delegate_to: null,
    security: { is_threat: false, threat_type: null, details: null },
  },
  {
    id: 3,
    category: "IGNORE",
    urgency: "low",
    reasoning: "Personal message.",
    drafted_response: null,
    delegate_to: null,
    security: { is_threat: false, threat_type: null, details: null },
  },
];

describe("buildClassificationPrompt", () => {
  it("includes all message IDs in the prompt", () => {
    const prompt = buildClassificationPrompt(sampleMessages);
    for (const msg of sampleMessages) {
      expect(prompt).toContain(`"id": ${msg.id}`);
    }
  });

  it("includes classification instructions", () => {
    const prompt = buildClassificationPrompt(sampleMessages);
    expect(prompt).toContain("IGNORE");
    expect(prompt).toContain("DELEGATE");
    expect(prompt).toContain("DECIDE");
  });

  it("includes urgency levels", () => {
    const prompt = buildClassificationPrompt(sampleMessages);
    expect(prompt).toContain("critical");
    expect(prompt).toContain("high");
    expect(prompt).toContain("medium");
    expect(prompt).toContain("low");
  });

  it("includes security assessment instructions", () => {
    const prompt = buildClassificationPrompt(sampleMessages);
    expect(prompt).toContain("phishing");
    expect(prompt).toContain("is_threat");
    expect(prompt).toContain("suspicious");
  });

  it("includes message bodies", () => {
    const prompt = buildClassificationPrompt(sampleMessages);
    expect(prompt).toContain("term sheet");
    expect(prompt).toContain("Deploy is done");
    expect(prompt).toContain("Dinner on Sunday");
  });
});

describe("buildCrossReferencePrompt", () => {
  it("includes both messages and classifications", () => {
    const prompt = buildCrossReferencePrompt(sampleMessages, sampleClassifications);
    expect(prompt).toContain("investor@vc.com");
    expect(prompt).toContain("DECIDE");
    expect(prompt).toContain("IGNORE");
  });

  it("includes thread detection instructions", () => {
    const prompt = buildCrossReferencePrompt(sampleMessages, sampleClassifications);
    expect(prompt).toContain("Thread Detection");
    expect(prompt).toContain("supersedes_earlier");
  });

  it("includes flag categories", () => {
    const prompt = buildCrossReferencePrompt(sampleMessages, sampleClassifications);
    expect(prompt).toContain("SECURITY");
    expect(prompt).toContain("REVENUE");
    expect(prompt).toContain("PEOPLE");
    expect(prompt).toContain("SCHEDULING");
    expect(prompt).toContain("OPERATIONAL");
  });

  it("includes briefing structure", () => {
    const prompt = buildCrossReferencePrompt(sampleMessages, sampleClassifications);
    expect(prompt).toContain("morning_type");
    expect(prompt).toContain("critical_actions");
    expect(prompt).toContain("decisions_needed");
    expect(prompt).toContain("good_news");
  });

  it("includes phishing detection instructions", () => {
    const prompt = buildCrossReferencePrompt(sampleMessages, sampleClassifications);
    expect(prompt).toContain("PHISHING");
    expect(prompt).toContain("SECURITY/critical");
  });

  it("includes escalation detection instructions", () => {
    const prompt = buildCrossReferencePrompt(sampleMessages, sampleClassifications);
    expect(prompt).toContain("ESCALATING");
  });
});
