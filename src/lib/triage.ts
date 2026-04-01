import { getGeminiFlash } from "./gemini";
import { buildClassificationPrompt, buildCrossReferencePrompt } from "./prompts";
import type {
  RawMessage,
  ClassifiedMessage,
  Thread,
  Flag,
  DailyBriefing,
  TriageResult,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  // Strip markdown code fences if the model wraps its response
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ── Pass 1: Classify each message ───────────────────────────────

async function classifyMessages(
  messages: RawMessage[]
): Promise<ClassifiedMessage[]> {
  const prompt = buildClassificationPrompt(messages);
  const model = getGeminiFlash();

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const classifications = parseJSON<ClassifiedMessage[]>(text);

  // Validate: ensure every message got classified
  const classifiedIds = new Set(classifications.map((c) => c.id));
  for (const msg of messages) {
    if (!classifiedIds.has(msg.id)) {
      classifications.push({
        id: msg.id,
        category: "DELEGATE",
        urgency: "medium",
        reasoning: "Message was not classified by the initial pass.",
        drafted_response: null,
        delegate_to: "EA / Chief of Staff",
        security: { is_threat: false, threat_type: null, details: null },
      });
    }
  }

  return classifications.sort((a, b) => a.id - b.id);
}

// ── Pass 2: Cross-reference + briefing ──────────────────────────

interface CrossReferenceResult {
  threads: Thread[];
  flags: Flag[];
  briefing: DailyBriefing;
}

async function crossReference(
  messages: RawMessage[],
  classifications: ClassifiedMessage[]
): Promise<CrossReferenceResult> {
  const prompt = buildCrossReferencePrompt(messages, classifications);
  const model = getGeminiFlash();

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJSON<CrossReferenceResult>(text);

  return {
    threads: parsed.threads || [],
    flags: parsed.flags || [],
    briefing: parsed.briefing || {
      morning_type: "busy",
      summary: "Multiple items require attention.",
      critical_actions: [],
      decisions_needed: [],
      good_news: [],
      upcoming_deadlines: [],
    },
  };
}

// ── Main pipeline ───────────────────────────────────────────────

export async function runTriagePipeline(
  messages: RawMessage[]
): Promise<TriageResult> {
  // Pass 1: classify individually
  const classifications = await classifyMessages(messages);

  // Pass 2: cross-reference and generate briefing
  const { threads, flags, briefing } = await crossReference(
    messages,
    classifications
  );

  return {
    classifications,
    threads,
    flags,
    briefing,
    processed_at: new Date().toISOString(),
    message_count: messages.length,
  };
}
