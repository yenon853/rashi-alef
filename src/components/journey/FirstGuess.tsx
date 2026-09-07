"use client";

import { useEffect, useState } from "react";
import { Feedback, PrintLetter, RashiLetter, Screen } from "@/components/ui";
import { TARGET_LETTER } from "@/lib/letters";

export function FirstGuess({
  options,
  onGuess,
}: {
  options: string[];
  /** called once the micro-interaction has played */
  onGuess: (guess: string, correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === TARGET_LETTER;

  useEffect(() => {
    if (!picked) return;
    const t = setTimeout(() => onGuess(picked, correct), 1700);
    return () => clearTimeout(t);
  }, [picked, correct, onGuess]);

  return (
    <Screen animKey="guess">
      <div
        className={`text-[min(46vw,15rem)] text-ink transition-transform duration-700 ${
          picked ? "scale-95" : ""
        }`}
        aria-label="אות בכתב רש״י"
        role="img"
      >
        <RashiLetter>{TARGET_LETTER}</RashiLetter>
      </div>

      <p className="text-2xl sm:text-3xl font-display">מה לדעתך האות הזאת?</p>

      <div className="flex gap-4 sm:gap-5" role="group" aria-label="אפשרויות">
        {options.map((opt) => {
          const isPicked = picked === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(opt)}
              aria-pressed={isPicked}
              className={`h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border bg-paper text-5xl sm:text-6xl shadow-soft transition-all duration-300 active:scale-95 disabled:cursor-default
                ${
                  isPicked
                    ? "border-ochre ring-4 ring-ochre/30 scale-105"
                    : picked
                      ? "border-line opacity-50"
                      : "border-line hover:border-ochre hover:shadow-lift"
                }`}
            >
              <PrintLetter>{opt}</PrintLetter>
            </button>
          );
        })}
      </div>

      <Feedback tone={picked && correct ? "positive" : "neutral"}>
        {picked ? (correct ? "יש לך עין טובה." : "מעניין. עוד רגע נגלה.") : " "}
      </Feedback>
    </Screen>
  );
}
