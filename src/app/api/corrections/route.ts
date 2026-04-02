import { NextRequest, NextResponse } from "next/server";
import { saveCorrection } from "@/lib/db";
import type { Category } from "@/lib/types";

const VALID_CATEGORIES: Category[] = ["IGNORE", "DELEGATE", "DECIDE"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      typeof body.message_id !== "number" ||
      !VALID_CATEGORIES.includes(body.original_category) ||
      !VALID_CATEGORIES.includes(body.corrected_category)
    ) {
      return NextResponse.json(
        { error: "Invalid correction data" },
        { status: 400 }
      );
    }

    const sessionId =
      typeof body.session_id === "string" ? body.session_id : null;

    const ok = await saveCorrection(sessionId, {
      message_id: body.message_id,
      original_category: body.original_category,
      corrected_category: body.corrected_category,
      message_summary: body.message_summary || "",
      timestamp: new Date().toISOString(),
    });

    if (!ok) {
      // Supabase unavailable -- not a fatal error for the client
      return NextResponse.json(
        { saved: false, reason: "Database unavailable" },
        { status: 202 }
      );
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("Failed to save correction:", err);
    return NextResponse.json(
      { error: "Failed to save correction" },
      { status: 500 }
    );
  }
}
