"use client";

import { RashiLetter, Rule, Screen } from "@/components/ui";
import { TARGET_LETTER } from "@/lib/letters";

export function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <>
      <Screen animKey="done" className="relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-6 text-[22rem] leading-none text-ochre/10 select-none"
        >
          <RashiLetter weight={400}>{TARGET_LETTER}</RashiLetter>
        </span>
        <Rule />
        <h2 className="relative font-display text-4xl sm:text-5xl font-medium leading-snug max-w-lg">
          מה קרה כאן שגרם לנו ללמוד?
        </h2>
        <p className="relative font-display text-2xl sm:text-3xl text-ink-soft">
          עכשיו חוזרים להיות מורים.
        </p>
      </Screen>
      <footer className="pb-6 pt-2 text-center">
        <button
          type="button"
          onClick={onRestart}
          className="text-sm text-ink-mute/70 hover:text-ink-soft underline-offset-4 hover:underline transition-colors"
        >
          להתחיל מההתחלה
        </button>
      </footer>
    </>
  );
}
