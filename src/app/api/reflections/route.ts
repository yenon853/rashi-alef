import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 2000;

type Body = {
  session_id?: unknown;
  meeting_id?: unknown;
  answer_1?: unknown;
  answer_2?: unknown;
  answer_3?: unknown;
  initial_guess?: unknown;
  initial_guess_correct?: unknown;
  attempts_identification?: unknown;
};

function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= MAX ? t : null;
}

/**
 * POST /api/reflections — a participant shares their three answers.
 * Anonymous by design: the only identifier is the client-generated session_id.
 * A repeated send with the same session_id is silently accepted (no duplicate row).
 */
export async function POST(req: Request) {
  const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

  if (!isDbConfigured()) return fail("לא הצלחנו לשמור כרגע. כדאי לנסות שוב.", 503);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail("לא הצלחנו לקרוא את התשובות. כדאי לנסות שוב.");
  }

  const sessionId = typeof body.session_id === "string" && UUID.test(body.session_id) ? body.session_id : null;
  const a1 = text(body.answer_1);
  const a2 = text(body.answer_2);
  const a3 = text(body.answer_3);
  if (!sessionId || !a1 || !a2 || !a3) return fail("חסרות תשובות. כדאי לבדוק ולנסות שוב.");

  const meetingId = typeof body.meeting_id === "string" && UUID.test(body.meeting_id) ? body.meeting_id : null;
  const guess =
    typeof body.initial_guess === "string" && body.initial_guess.length <= 4 ? body.initial_guess : null;
  const guessCorrect = typeof body.initial_guess_correct === "boolean" ? body.initial_guess_correct : null;
  const attempts =
    typeof body.attempts_identification === "number" && Number.isInteger(body.attempts_identification)
      ? Math.max(0, Math.min(500, body.attempts_identification))
      : null;

  try {
    await db().sql`
      insert into teacher_reflections
        (session_id, meeting_id, answer_1, answer_2, answer_3, learned_letter,
         initial_guess, initial_guess_correct, attempts_identification, completed_learning)
      values
        (${sessionId}, ${meetingId}, ${a1}, ${a2}, ${a3}, ${"א"},
         ${guess}, ${guessCorrect}, ${attempts}, ${true})
      on conflict (session_id) do nothing
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return fail("לא הצלחנו לשמור כרגע. כדאי לנסות שוב.", 500);
  }
}
