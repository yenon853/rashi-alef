"use client";

import { useEffect, useState } from "react";
import { Button, RashiLetter, Rule, Screen } from "@/components/ui";
import { TARGET_LETTER } from "@/lib/letters";

export function SuccessMoment({ onNext }: { onNext: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timers = [300, 1400, 2300].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const show = (n: number) =>
    `transition-all duration-700 ${stage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`;

  return (
    <Screen animKey="success">
      <div className="relative" role="img" aria-label="האות א בכתב רש״י">
        <span
          aria-hidden
          className={`absolute inset-0 -m-10 rounded-full bg-ochre/10 blur-2xl transition-all duration-[1400ms] ${
            stage >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`relative text-[min(44vw,14rem)] text-sepia transition-transform duration-[1200ms] ease-out ${
            stage >= 1 ? "scale-100" : "scale-90"
          }`}
        >
          <RashiLetter>{TARGET_LETTER}</RashiLetter>
        </div>
      </div>

      <Rule className={show(2)} />

      <p className={`font-display text-2xl sm:text-3xl leading-relaxed max-w-md ${show(2)}`}>
        לפני כמה דקות היא הייתה זרה.
        <br />
        <span className="text-sepia">עכשיו כבר זיהית אותה לבד.</span>
      </p>

      <div className={show(3)}>
        <Button onClick={onNext} disabled={stage < 3} className="min-w-56">
          רגע לפני שמסיימים
        </Button>
      </div>
    </Screen>
  );
}
