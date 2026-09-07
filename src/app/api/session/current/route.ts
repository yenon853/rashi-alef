import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Tells a participant which meeting is currently open, so their reflection
 * can be linked to it. Nothing else about the meeting is exposed.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (!isDbConfigured()) return NextResponse.json({ meetingId: null }, { headers });
  try {
    const rows = await db().sql<{ id: string }>`
      select id from sessions where ended_at is null order by started_at desc limit 1
    `;
    return NextResponse.json({ meetingId: rows[0]?.id ?? null }, { headers });
  } catch {
    return NextResponse.json({ meetingId: null }, { headers });
  }
}
