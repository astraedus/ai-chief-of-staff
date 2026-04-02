import { getSupabaseServiceClient } from "./supabase";
import type {
  TriageResult,
  RawMessage,
  Correction,
  ClassifiedMessage,
} from "./types";

// ── Session types (returned from DB) ────────────────────────────

export interface SessionSummary {
  id: string;
  created_at: string;
  message_count: number;
  source: string;
}

export interface SessionFull {
  id: string;
  created_at: string;
  message_count: number;
  source: string;
  briefing: TriageResult["briefing"];
  flags: TriageResult["flags"];
  threads: TriageResult["threads"];
  classifications: Array<
    ClassifiedMessage & { original_message: RawMessage }
  >;
}

// ── Save a triage session + classifications ─────────────────────

export async function saveTriageSession(
  result: TriageResult,
  messages: RawMessage[],
  source: string
): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  // Insert session
  const { data: session, error: sessionErr } = await supabase
    .from("triage_sessions")
    .insert({
      message_count: result.message_count,
      briefing: result.briefing,
      flags: result.flags,
      threads: result.threads,
      source,
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    console.error("Failed to save triage session:", sessionErr);
    return null;
  }

  // Build classification rows
  const classificationRows = result.classifications.map((c) => {
    const originalMsg = messages.find((m) => m.id === c.id) || {};
    return {
      session_id: session.id,
      message_id: c.id,
      category: c.category,
      urgency: c.urgency,
      reasoning: c.reasoning,
      drafted_response: c.drafted_response,
      delegate_to: c.delegate_to,
      security: c.security,
      original_message: originalMsg,
    };
  });

  const { error: classErr } = await supabase
    .from("classifications")
    .insert(classificationRows);

  if (classErr) {
    console.error("Failed to save classifications:", classErr);
    // Session was created but classifications failed -- still return ID
  }

  return session.id;
}

// ── Get recent sessions ─────────────────────────────────────────

export async function getRecentSessions(
  limit: number = 10
): Promise<SessionSummary[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("triage_sessions")
    .select("id, created_at, message_count, source")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch recent sessions:", error);
    return [];
  }

  return data || [];
}

// ── Get full session with classifications ───────────────────────

export async function getSession(id: string): Promise<SessionFull | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  // Fetch session
  const { data: session, error: sessionErr } = await supabase
    .from("triage_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (sessionErr || !session) {
    console.error("Failed to fetch session:", sessionErr);
    return null;
  }

  // Fetch classifications
  const { data: classifications, error: classErr } = await supabase
    .from("classifications")
    .select("*")
    .eq("session_id", id)
    .order("message_id", { ascending: true });

  if (classErr) {
    console.error("Failed to fetch classifications:", classErr);
    return null;
  }

  return {
    id: session.id,
    created_at: session.created_at,
    message_count: session.message_count,
    source: session.source,
    briefing: session.briefing,
    flags: session.flags,
    threads: session.threads,
    classifications: (classifications || []).map((c) => ({
      id: c.message_id,
      category: c.category,
      urgency: c.urgency,
      reasoning: c.reasoning,
      drafted_response: c.drafted_response,
      delegate_to: c.delegate_to,
      security: c.security,
      original_message: c.original_message,
    })),
  };
}

// ── Save a correction ───────────────────────────────────────────

export async function saveCorrection(
  sessionId: string | null,
  correction: Correction
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from("corrections").insert({
    session_id: sessionId,
    message_id: correction.message_id,
    original_category: correction.original_category,
    corrected_category: correction.corrected_category,
    message_summary: correction.message_summary,
  });

  if (error) {
    console.error("Failed to save correction:", error);
    return false;
  }

  return true;
}

// ── Get all corrections (for few-shot learning) ─────────────────

export async function getCorrections(): Promise<Correction[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("corrections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch corrections:", error);
    return [];
  }

  return (data || []).map((c) => ({
    message_id: c.message_id,
    original_category: c.original_category,
    corrected_category: c.corrected_category,
    message_summary: c.message_summary,
    timestamp: c.created_at,
  }));
}
