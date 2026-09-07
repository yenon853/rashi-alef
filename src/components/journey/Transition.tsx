"use client";

import { useEffect, useState } from "react";
import { Screen } from "@/components/ui";

/** The turn from "student" back to "teacher": the room gets quieter and darker. */
export function Transition({ onNext }: { onNext: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timers = [600, 2600, 3600].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const show = (n: number) =>
    `transition-all duration-1000 ${stage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;

  return (
    <Screen animKey="transition" tone="dark" className="bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(184,144,63,0.16),transparent_60%)]">
      <p className={`font-display text-3xl sm:text-4xl leading-relaxed text-cream/90 ${show(1)}`}>
        רגע לפני שחוזרים להיות מורים...
      </p>
      <p className={`font-display text-4xl sm:text-5xl font-medium text-cream ${show(2)}`}>
        מה בעצם קרה כאן?
      </p>
      <div className={show(3)}>
        <button
          type="button"
          onClick={onNext}
          disabled={stage < 3}
          className="min-h-14 min-w-64 rounded-full border border-cream/40 bg-cream/5 px-9 text-xl font-medium text-cream transition-all duration-300 hover:bg-cream hover:text-ink active:scale-[0.98] disabled:opacity-40"
        >
          אני רוצה לחשוב על זה
        </button>
      </div>
    </Screen>
  );
}
