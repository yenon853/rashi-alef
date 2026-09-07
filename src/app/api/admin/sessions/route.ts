import { NextResponse } from "next/server";
import { isFacilitator } from "@/lib/admin-auth";
import { db, isDbConfigured } from "@/lib/db";
import type { MeetingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, message: "נדרשת כניסת מנחה." }, { status: 401 });
}

function notConfigured() {
  return NextResponse.json({ ok: false, message: "מסד הנתונים עדיין לא מוגדר." }, { status: 503 });
}

/** GET /api/admin/sessions — all meetings, newest first, with reflection counts. */
export async function GET() {
  if (!(await isFacilitator())) return unauthorized();
  if (!isDbConfigured()) return notConfigured();

  try {
    const rows = await db().sql<Omit<MeetingRow, "count"> & { count: string | number }>`
      select s.id, s.title, s.started_at, s.ended_at,
             (select count(*) from teacher_reflections r where r.meeting_id = s.id) as count
      from sessions s
      order by s.started_at desc
      limit 200
    `;
    const sessions: MeetingRow[] = rows.map((r) => ({ ...r, count: Number(r.count) }));
    return NextResponse.json({ ok: true, sessions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, message: "לא הצלחנו לטעון את המפגשים כרגע." }, { status: 500 });
  }
}

/**
 * POST /api/admin/sessions — "התחלת מפגש חדש".
 * Closes every open meeting and opens a new one. Deletes nothing.
 */
export async function POST(req: Request) {
  if (!(await isFacilitator())) return unauthorized();
  if (!isDbConfigured()) return notConfigured();

  let title = "";
  try {
    const body = (await req.json()) as { title?: unknown };
    title = typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";
  } catch {
    title = "";
  }
  if (!title) {
    title = `מפגש ${new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" })}`;
  }

  try {
    const sql = db().sql;
    await sql`update sessions set ended_at = now() where ended_at is null`;
    const [session] = await sql<Omit<MeetingRow, "count">>`
      insert into sessions (title) values (${title})
      returning id, title, started_at, ended_at
    `;
    return NextResponse.json({ ok: true, session: { ...session, count: 0 } as MeetingRow });
  } catch {
    return NextResponse.json(
      { ok: false, message: "לא הצלחנו לפתוח מפגש חדש כרגע. כדאי לנסות שוב." },
      { status: 500 },
    );
  }
}
