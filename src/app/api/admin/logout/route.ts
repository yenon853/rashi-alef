import { NextResponse } from "next/server";
import { FACILITATOR_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FACILITATOR_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
