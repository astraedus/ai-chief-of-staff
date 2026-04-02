import type { RawMessage, Correction } from "./types";

// ── Build correction context for few-shot learning ──────────────
function buildCorrectionContext(corrections: Correction[]): string {
  if (corrections.length === 0) return "";

  const examples = corrections
    .slice(-10) // last 10 corrections
    .map(
      (c) =>
        `- "${c.message_summary}" was classified as ${c.original_category}, but the CEO corrected it to ${c.corrected_category}.`
    )
    .join("\n");

  return `\n\nIMPORTANT — The CEO has previously corrected these classifications. Learn from their judgment and apply similar logic to analogous messages:\n${examples}\n`;
}

// ── Pass 1: Individual message classification ───────────────────
export function buildClassificationPrompt(
  messages: RawMessage[],
  corrections: Correction[] = []
): string {
  const correctionContext = buildCorrectionContext(corrections);

  return `You are an AI Chief of Staff triaging a CEO's morning communications. For each message, determine:

1. **Category**:
   - IGNORE: No CEO involvement needed (newsletters, spam, FYI updates with no action, personal messages, already-resolved issues)
   - DELEGATE: Can be handled by someone else with a clear handoff (scheduling logistics, routine acknowledgments, standard follow-ups)
   - DECIDE: The CEO must personally act (strategic decisions, financial commitments, urgent operational issues, investor relations, hiring decisions)

2. **Urgency**: critical (needs action within 1 hour), high (today), medium (this week), low (whenever)

3. **Reasoning**: One sentence explaining why this classification.

4. **Drafted Response**: A ready-to-send response appropriate for the channel. Match the tone (formal for email, casual for Slack/WhatsApp). If Ignore, set to null. If Delegate, draft a handoff message to the right person.

5. **Delegate To**: If category is DELEGATE, specify who should handle it (name or role). Otherwise null.

6. **Security Assessment**: Flag phishing attempts, suspicious links, impersonation. Check sender domains carefully. For every message assess:
   - is_threat: boolean
   - threat_type: "phishing" | "impersonation" | "suspicious_link" | null
   - details: explanation if threat, null otherwise

Classify based on what a CEO of a growth-stage startup (50-200 people, raising Series B) would care about. Their time is worth $500/hour -- only surface what justifies that cost.

Respond with a JSON array of objects, one per message, with this exact schema:
{
  "id": number,
  "category": "IGNORE" | "DELEGATE" | "DECIDE",
  "urgency": "critical" | "high" | "medium" | "low",
  "reasoning": string,
  "drafted_response": string | null,
  "delegate_to": string | null,
  "security": {
    "is_threat": boolean,
    "threat_type": string | null,
    "details": string | null
  }
}

Here are the messages to classify:

${JSON.stringify(messages, null, 2)}${correctionContext}`;
}

// ── Pass 2: Cross-reference, thread detection, briefing ─────────
export function buildCrossReferencePrompt(
  messages: RawMessage[],
  classifications: unknown[]
): string {
  return `You are generating an executive briefing from pre-classified messages. You have access to all messages and their classifications.

Your tasks:

1. **Thread Detection**: Group related messages into threads. Identify the LATEST status of each thread. Flag when earlier messages are superseded by later ones. Output as JSON array:
{
  "title": string,
  "message_ids": number[],
  "latest_status": string,
  "supersedes_earlier": boolean
}

2. **Flags**: Generate alerts for anything the CEO should know about, even if individual messages were classified as Delegate or Ignore. Be exhaustive -- find every notable pattern. Categories: SECURITY (phishing, data), REVENUE (deal changes, payment issues), PEOPLE (team morale, hiring), SCHEDULING (conflicts, deadlines), OPERATIONAL (system failures, timeline risks). Output as JSON array:
{
  "title": string,
  "category": "SECURITY" | "REVENUE" | "PEOPLE" | "SCHEDULING" | "OPERATIONAL",
  "severity": "critical" | "warning" | "info",
  "description": string,
  "related_message_ids": number[]
}

IMPORTANT flag detection rules:
- A message from a suspicious/unknown domain with urgency language and a verification link is PHISHING. Flag it as SECURITY/critical.
- When the same person sends multiple messages that show a situation ESCALATING (getting worse over time), flag the escalation pattern.
- When two events are scheduled at the same time, flag the SCHEDULING conflict.
- When someone says one thing then contradicts it, note which message supersedes.
- When a deal size changes significantly, flag it as REVENUE.
- When a system affects live users/payments, flag as OPERATIONAL/critical.

3. **Daily Briefing**: Write a concise executive summary (max 200 words) that a CEO reads in under 2 minutes. Structure it as:
{
  "morning_type": string (one word: "calm", "busy", "crisis", etc.),
  "summary": string (2-3 sentence overview),
  "critical_actions": string[] (items needing immediate action),
  "decisions_needed": string[] (decisions for today),
  "good_news": string[] (positive developments),
  "upcoming_deadlines": string[] (this week's deadlines)
}

Be direct. No fluff. Write like a McKinsey consultant briefing a CEO.

Respond with a single JSON object:
{
  "threads": [...],
  "flags": [...],
  "briefing": {...}
}

MESSAGES:
${JSON.stringify(messages, null, 2)}

CLASSIFICATIONS:
${JSON.stringify(classifications, null, 2)}`;
}
