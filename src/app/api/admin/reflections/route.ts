import { NextResponse } from "next/server";
import { isFacilitator } from "@/lib/admin-auth";
import { db, isDbConfigured } from "@/lib/db";
import type { ReflectionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/reflections?meeting=<uuid|all>&since=<ISO>
 * Facilitator only. Returns anonymous rows — never session ids.
 */
export async function GET(req: Request) {
  if (!(await isFacilitator())) {
    return NextResponse.json({ ok: false, message: "נדרשת כניסת מנחה." }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, message: "מסד הנתונים עדיין לא מוגדר." }, { status: 503 });
  }

  const url = new URL(req.url);
  const meetingParam = url.searchParams.get("meeting") ?? "all";
  const sinceParam = url.searchParams.get("since");
  const meeting = meetingParam !== "all" && UUID.test(meetingParam) ? meetingParam : null;
  const since = sinceParam && !Number.isNaN(Date.parse(sinceParam)) ? new Date(sinceParam) : null;

  try {
    const rows = await db().sql<ReflectionRow>`
      select id, meeting_id, answer_1, answer_2, answer_3, initial_guess,
             initial_guess_correct, attempts_identification, completed_learning, created_at
      from teacher_reflections
      where (${meeting}::uuid is null or meeting_id = ${meeting}::uuid)
        and (${since}::timestamptz is null or created_at >= ${since}::timestamptz)
      order by created_at asc
      limit 2000
    `;
    return NextResponse.json({ ok: true, rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, message: "לא הצלחנו לטעון את המחשבות כרגע. כדאי לנסות שוב." },
      { status: 500 },
    );
  }
}
