import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

// Lightweight Supabase liveness check.
//
// Purpose: keep the Supabase free-tier project alive (7-day inactivity =
// auto-pause). Hit this from a GitHub Actions cron every Mon + Thu so the
// max idle gap is 4 days.
//
// Returns 204 No Content with no body so this endpoint never leaks data
// (the existing /api/sessions route exposes triage_sessions metadata
// publicly which is fine for now but bad practice to call from cron).
//
// HEAD-style count query is the cheapest possible Supabase touch.
export async function GET() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase client unavailable" },
      { status: 503 },
    );
  }

  const { error } = await supabase
    .from("triage_sessions")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 503 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
