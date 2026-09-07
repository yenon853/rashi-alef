"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Rule } from "@/components/ui";

export function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (res.ok && data.ok) {
        router.refresh();
      } else {
        setMessage(data.message || "הקוד לא מתאים. כדאי לנסות שוב.");
        setBusy(false);
      }
    } catch {
      setMessage("לא הצלחנו להתחבר כרגע. כדאי לנסות שוב.");
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-card bg-paper border border-line shadow-soft p-8 flex flex-col items-center gap-6 text-center animate-fade-up"
      >
        <Rule />
        <h1 className="font-display text-3xl font-medium">כניסה למצב מנחה</h1>
        <label className="w-full text-start">
          <span className="block text-sm text-ink-soft mb-2">קוד גישה</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-2xl tracking-[0.4em] text-center outline-none focus:border-ochre transition-colors"
            aria-describedby={message ? "login-message" : undefined}
            aria-invalid={message ? true : undefined}
            autoFocus
          />
        </label>
        {message && (
          <p id="login-message" role="alert" className="text-sepia -mt-2">
            {message}
          </p>
        )}
        <Button type="submit" size="md" disabled={busy || !code.trim()} className="w-full">
          {busy ? "בודקים..." : "כניסה"}
        </Button>
        <Link href="/" className="text-sm text-ink-mute hover:text-ink-soft underline-offset-4 hover:underline">
          חזרה לחוויה
        </Link>
      </form>
    </main>
  );
}
