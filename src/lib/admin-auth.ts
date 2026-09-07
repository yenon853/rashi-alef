import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Facilitator authentication.
 *
 * - The access code lives ONLY in the ADMIN_CODE environment variable and is
 *   compared on the server (timing-safe). It never reaches the browser bundle.
 * - After a successful login the server issues an HttpOnly cookie carrying an
 *   HMAC-signed, expiring token. Route handlers verify it on every request.
 */

export const FACILITATOR_COOKIE = "facilitator_session";
const SESSION_HOURS = 12;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  // Fallback keeps local development working; production must set a real secret.
  return `dev-secret-${process.env.ADMIN_CODE ?? ""}-change-me`;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyAdminCode(input: string): boolean {
  const expected = process.env.ADMIN_CODE;
  if (!expected) return false;
  return safeEqual(input.trim(), expected.trim());
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Date.now();
}

export async function isFacilitator(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(FACILITATOR_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}
