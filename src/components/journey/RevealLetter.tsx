"use client";

import { useEffect, useState } from "react";
import { Button, PrintLetter, RashiLetter, Screen } from "@/components/ui";
import { TARGET_LETTER } from "@/lib/letters";

export function RevealLetter({ onNext }: { onNext: () => void }) {
  // staged entrance: print letter → arrow → Rashi letter → sentence → button
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timers = [400, 900, 1500, 2100].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const show = (n: number) =>
    `transition-all duration-700 ${stage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`;

  return (
    <Screen animKey="reveal">
      <h2 className="font-display text-4xl sm:text-5xl font-medium">זאת א.</h2>

      <div className="flex items-center justify-center gap-6 sm:gap-10" dir="rtl">
        <div className={`text-[min(28vw,9rem)] ${show(1)}`} aria-label="א בדפוס" role="img">
          <PrintLetter>{TARGET_LETTER}</PrintLetter>
        </div>
        <span
          className={`text-4xl sm:text-5xl text-ochre ${show(2)}`}
          aria-hidden
        >
          ←
        </span>
        <div className={`relative text-[min(28vw,9rem)] ${show(3)}`} aria-label="א בכתב רש״י" role="img">
          <RashiLetter>{TARGET_LETTER}</RashiLetter>
          {stage >= 3 && (
            <span
              aria-hidden
              className="absolute inset-0 -m-3 rounded-full animate-glow motion-reduce:hidden"
            />
          )}
        </div>
      </div>

      <p className={`text-2xl sm:text-3xl font-display text-ink-soft ${show(4)}`}>
        אותה אות. צורה אחרת.
      </p>

      <div className={show(4)}>
        <Button onClick={onNext} disabled={stage < 4} className="min-w-56">
          ננסה למצוא אותה
        </Button>
      </div>
    </Screen>
  );
}
