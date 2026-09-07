"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ---------- Buttons ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "lg" | "md" | "sm";
};

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,box-shadow,opacity] duration-200 select-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
  const sizes = {
    lg: "min-h-14 px-9 text-xl",
    md: "min-h-12 px-6 text-lg",
    sm: "min-h-10 px-4 text-base",
  }[size];
  const variants = {
    primary: "bg-ink text-cream shadow-soft hover:bg-sepia hover:shadow-lift",
    secondary:
      "bg-paper text-ink border border-line shadow-soft hover:border-ochre hover:shadow-lift",
    ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-cream-deep",
  }[variant];
  return (
    <button type="button" className={`${base} ${sizes} ${variants} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Screen shell ---------- */

export function Screen({
  children,
  tone = "light",
  className = "",
  animKey,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  /** changing this re-runs the entrance animation */
  animKey?: string;
}) {
  const toneCls =
    tone === "dark" ? "bg-ink text-cream" : "text-ink";
  return (
    <main
      key={animKey}
      className={`flex-1 flex flex-col items-center justify-center px-6 py-10 sm:px-10 animate-fade-in ${toneCls} ${className}`}
    >
      <div className="w-full max-w-xl flex flex-col items-center text-center gap-8 animate-fade-up">
        {children}
      </div>
    </main>
  );
}

/* ---------- Progress: a few quiet dots, never a number ---------- */

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div
      className="fixed top-5 inset-x-0 flex justify-center gap-2 pointer-events-none"
      aria-label={`התקדמות: ${current + 1} מתוך ${total}`}
      role="img"
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i < current
              ? "w-3.5 bg-ochre"
              : i === current
                ? "w-6 bg-ink"
                : "w-3.5 bg-line"
          }`}
        />
      ))}
    </div>
  );
}

/* ---------- Letters ---------- */

/** A letter rendered in authentic Rashi script (Noto Rashi Hebrew). */
export function RashiLetter({
  children,
  className = "",
  weight = 600,
}: {
  children: string;
  className?: string;
  weight?: 400 | 600;
}) {
  return (
    <span
      className={`font-rashi leading-none ${className}`}
      style={{ fontWeight: weight }}
      lang="he"
    >
      {children}
    </span>
  );
}

/** A letter in regular print (the serif heading face). */
export function PrintLetter({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`font-display font-medium leading-none ${className}`} lang="he">
      {children}
    </span>
  );
}

/* ---------- Feedback line: short, warm, never red ---------- */

export function Feedback({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive";
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`min-h-8 text-xl sm:text-2xl font-display ${
        tone === "positive" ? "text-sepia" : "text-ink-soft"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/* ---------- Ornament: a thin ochre rule ---------- */

export function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-ochre ${className}`} aria-hidden>
      <span className="h-px w-10 bg-ochre/60" />
      <span className="h-1.5 w-1.5 rotate-45 bg-ochre" />
      <span className="h-px w-10 bg-ochre/60" />
    </div>
  );
}
