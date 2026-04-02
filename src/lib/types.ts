// ── Raw input types ──────────────────────────────────────────────
export interface RawMessage {
  id: number;
  channel: "email" | "slack" | "whatsapp";
  from: string;
  to?: string;
  subject?: string;
  channel_name?: string;
  timestamp: string;
  body: string;
}

// ── Pass 1: Classification ───────────────────────────────────────
export type Category = "IGNORE" | "DELEGATE" | "DECIDE";
export type Urgency = "critical" | "high" | "medium" | "low";

export interface SecurityAssessment {
  is_threat: boolean;
  threat_type: string | null;
  details: string | null;
}

export interface ClassifiedMessage {
  id: number;
  category: Category;
  urgency: Urgency;
  reasoning: string;
  drafted_response: string | null;
  delegate_to: string | null;
  security: SecurityAssessment;
}

// ── Pass 2: Cross-reference ──────────────────────────────────────
export type FlagCategory =
  | "SECURITY"
  | "REVENUE"
  | "PEOPLE"
  | "SCHEDULING"
  | "OPERATIONAL";

export type FlagSeverity = "critical" | "warning" | "info";

export interface Flag {
  title: string;
  category: FlagCategory;
  severity: FlagSeverity;
  description: string;
  related_message_ids: number[];
}

export interface Thread {
  title: string;
  message_ids: number[];
  latest_status: string;
  supersedes_earlier: boolean;
}

export interface DailyBriefing {
  morning_type: string;
  summary: string;
  critical_actions: string[];
  decisions_needed: string[];
  good_news: string[];
  upcoming_deadlines: string[];
}

// ── Combined result ──────────────────────────────────────────────
export interface TriageResult {
  classifications: ClassifiedMessage[];
  threads: Thread[];
  flags: Flag[];
  briefing: DailyBriefing;
  processed_at: string;
  message_count: number;
}

// ── Corrections / Feedback ───────────────────────────────────────
export interface Correction {
  message_id: number;
  original_category: Category;
  corrected_category: Category;
  message_summary: string;
  timestamp: string;
}

// ── UI state ─────────────────────────────────────────────────────
export type FilterTab = "all" | "decide" | "delegate" | "ignore";

export interface ProcessingStatus {
  stage: "idle" | "classifying" | "cross_referencing" | "complete" | "error";
  progress: number; // 0-100
  message: string;
}
