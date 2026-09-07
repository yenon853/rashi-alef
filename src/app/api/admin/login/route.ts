import { NextResponse } from "next/server";
import {
  FACILITATOR_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyAdminCode,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Best-effort brute-force protection (per server instance). */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 12;

function clientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const key = clientKey(req);
  if (tooManyAttempts(key)) {
    return NextResponse.json(
      { ok: false, message: "יותר מדי ניסיונות. כדאי לנסות שוב בעוד כמה דקות." },
      { status: 429 },
    );
  }

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    code = "";
  }

  if (!verifyAdminCode(code)) {
    // small constant delay makes guessing slower without hurting real users
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { ok: false, message: "הקוד לא מתאים. כדאי לנסות שוב." },
      { status: 401 },
    );
  }

  attempts.delete(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FACILITATOR_COOKIE, createSessionToken(), sessionCookieOptions());
  return res;
}
