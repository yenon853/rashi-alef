"use client";

import Link from "next/link";
import { Button, Rule, Screen } from "@/components/ui";

export function LearningIntro({ onStart }: { onStart: () => void }) {
  return (
    <>
      <Screen animKey="intro">
        <Rule />
        <h1 className="font-display text-5xl sm:text-6xl font-medium leading-tight tracking-tight text-balance">
          כתב שנראה קצת אחרת
        </h1>
        <p className="text-xl sm:text-2xl text-ink-soft leading-relaxed max-w-sm">
          כמה דקות. אות אחת.
          <br />
          נראה אם היא תישאר איתך.
        </p>
        <Button onClick={onStart} className="mt-2 min-w-52">
          מתחילים
        </Button>
      </Screen>
      <footer className="pb-6 pt-2 text-center">
        <Link
          href="/admin"
          className="text-sm text-ink-mute hover:text-ink-soft underline-offset-4 hover:underline transition-colors"
        >
          כניסת מנחה
        </Link>
      </footer>
    </>
  );
}
