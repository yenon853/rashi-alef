"use client";

import { hashSeed } from "@/lib/letters";
import { repeatedWords } from "@/lib/text";

/* ---------- Answer card ---------- */

const TINTS = ["bg-paper", "bg-ochre-tint", "bg-sage-tint", "bg-indigo-tint", "bg-rose-tint"];

export function tintFor(id: string): string {
  return TINTS[hashSeed(id) % TINTS.length];
}

export function AnswerCard({
  id,
  text,
  fresh = false,
  size = "md",
  index = 0,
}: {
  id: string;
  text: string;
  fresh?: boolean;
  size?: "md" | "lg" | "xl";
  index?: number;
}) {
  const sizes = {
    md: "text-xl sm:text-2xl px-6 py-6",
    lg: "text-2xl sm:text-3xl px-8 py-8",
    xl: "text-[clamp(1.6rem,2.4vw,3rem)] px-10 py-9",
  }[size];
  return (
    <blockquote
      className={`break-inside-avoid mb-5 rounded-card border border-line/60 leading-relaxed text-ink font-display ${tintFor(id)} ${sizes} ${
        fresh ? "animate-settle ring-2 ring-ochre/40" : "animate-fade-in"
      }`}
      style={{ animationDelay: fresh ? "0ms" : `${Math.min(index * 60, 900)}ms` }}
    >
      {text}
    </blockquote>
  );
}

/* ---------- Repeated words ---------- */

export function RepeatedWords({
  answers,
  big = false,
}: {
  answers: string[];
  big?: boolean;
}) {
  const words = repeatedWords(answers);
  if (words.length === 0) return null;
  const max = words[0].count;
  return (
    <section aria-label="מילים שחזרו בקבוצה" className="flex flex-col gap-3">
      <h3 className={`font-display text-ink-soft ${big ? "text-2xl" : "text-lg"}`}>מילים שחזרו בקבוצה</h3>
      <ul className="flex flex-wrap gap-3">
        {words.map((w, i) => {
          const t = max <= 1 ? 0.4 : w.count / max;
          const scale = big ? 1.6 : 1;
          return (
            <li
              key={w.word}
              className="inline-flex items-baseline gap-2 rounded-full bg-paper border border-line px-4 py-1.5 animate-fade-in"
              style={{ fontSize: `${(1 + t * 0.6) * scale}rem`, animationDelay: `${i * 60}ms` }}
            >
              <span className="font-medium text-ink">{w.word}</span>
              {w.count > 1 && (
                <span className="text-ink-mute text-[0.65em]" aria-label={`ב-${w.count} תשובות`}>
                  ×{w.count}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Empty & loading ---------- */

export function EmptyState({ big = false }: { big?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-16 animate-fade-in">
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-ochre animate-drift"
            style={{ animationDelay: `${i * 300}ms` }}
          />
        ))}
      </div>
      <p className={`font-display ${big ? "text-4xl" : "text-2xl"} text-ink`}>עוד רגע הן יתחילו להגיע...</p>
      <p className={`${big ? "text-2xl" : "text-lg"} text-ink-soft max-w-md`}>
        כשהמשתתפים יסיימו את החוויה, המחשבות שלהם יופיעו כאן בזמן אמת.
      </p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="py-16 text-center animate-fade-in">
      <p className="font-display text-2xl text-ink-soft animate-drift">טוענים את מחשבות הקבוצה...</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-12 text-center flex flex-col items-center gap-4 animate-fade-in" role="alert">
      <p className="font-display text-2xl text-sepia">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-line bg-paper px-6 py-2 text-lg hover:border-ochre transition-colors"
      >
        ניסיון נוסף
      </button>
    </div>
  );
}

/* ---------- Small controls ---------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`inline-flex rounded-full bg-cream-deep p-1 ${size === "lg" ? "text-lg" : "text-base"}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              active ? "bg-ink text-cream shadow-soft" : "text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
