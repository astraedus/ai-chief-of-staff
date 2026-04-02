import { NextRequest, NextResponse } from "next/server";
import { getRecentSessions } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      50
    );

    const sessions = await getRecentSessions(limit);

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("Failed to fetch sessions:", err);
    return NextResponse.json(
      { error: "Failed to fetch sessions", sessions: [] },
      { status: 500 }
    );
  }
}
