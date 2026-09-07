"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Feedback, RashiLetter, Screen } from "@/components/ui";
import { TARGET_LETTER, type Round } from "@/lib/letters";

type Copy = {
  heading?: string;
  prompt: string;
  success: string;
  miss: string;
  /** show the reference shape automatically after a miss */
  autoHint: boolean;
  /** offer a "רמז" button after the first miss */
  hintButton: boolean;
  /** ms to linger on success before moving on */
  linger: number;
};

const COPY: Record<Round["id"], Copy> = {
  find: {
    prompt: "אפשר למצוא כאן א?",
    success: "כן. זו היא.",
    miss: "עוד מבט קטן על המבנה שלה.",
    autoHint: true,
    hintButton: false,
    linger: 1800,
  },
  context: {
    prompt: "גם כשהיא מסתתרת בין אחרות — אפשר לזהות אותה?",
    success: "יפה. כבר לא צריך לראות אותה לבד.",
    miss: "כמעט. שווה להסתכל שוב על הצורה.",
    autoHint: false,
    hintButton: false,
    linger: 2000,
  },
  context2: {
    prompt: "איפה היא?",
    success: "כן. זו היא.",
    miss: "עוד מבט קטן.",
    autoHint: false,
    hintButton: true,
    linger: 1800,
  },
  retrieval: {
    heading: "ועכשיו בלי גלגלי עזר.",
    prompt: "איזו מהן א?",
    success: "כן. זו היא.",
    miss: "כמעט. שווה להסתכל שוב על הצורה.",
    autoHint: false,
    hintButton: false,
    linger: 1300,
  },
};

export function RecognitionRound({
  round,
  onSolved,
}: {
  round: Round;
  /** attempts = number of taps it took (1 = first try) */
  onSolved: (attempts: number) => void;
}) {
  const copy = COPY[round.id];
  const [taps, setTaps] = useState(0);
  const [missed, setMissed] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHint = (ms: number) => {
    setHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(false), ms);
  };

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  useEffect(() => {
    if (!solved) return;
    const t = setTimeout(() => onSolved(taps), copy.linger);
    return () => clearTimeout(t);
  }, [solved, taps, copy.linger, onSolved]);

  const tap = (i: number) => {
    if (solved) return;
    const n = taps + 1;
    setTaps(n);
    if (i === round.target) {
      setMissed(null);
      setHint(false);
      setSolved(true);
    } else {
      setMissed(i);
      if (copy.autoHint) showHint(2200);
    }
  };

  const tileState = (i: number) => {
    if (solved && i === round.target) return "solved";
    if (solved) return "faded";
    if (missed === i) return "missed";
    return "idle";
  };

  const tileCls = (state: string, word: boolean) => {
    const base = word
      ? "px-1 sm:px-2 py-3 rounded-2xl leading-none"
      : "h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border bg-paper shadow-soft";
    const byState: Record<string, string> = {
      idle: word ? "hover:bg-cream-deep" : "border-line hover:border-ochre hover:shadow-lift",
      missed: word
        ? "bg-cream-deep text-ink-soft animate-nudge"
        : "border-line bg-cream-deep text-ink-soft animate-nudge",
      solved: word
        ? "bg-ochre-tint ring-4 ring-ochre/40 scale-110 animate-glow"
        : "border-ochre bg-ochre-tint ring-4 ring-ochre/40 scale-105 animate-glow",
      faded: "opacity-35",
    };
    return `${base} ${byState[state]} transition-all duration-300 active:scale-95 disabled:cursor-default`;
  };

  return (
    <Screen animKey={round.id}>
      {copy.heading && (
        <p className="font-display text-2xl sm:text-3xl text-sepia -mb-4">{copy.heading}</p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl font-medium leading-snug max-w-md">
        {copy.prompt}
      </h2>

      {round.asWord ? (
        <div
          className="flex items-center justify-center text-ink py-4 leading-none"
          style={{ fontSize: `min(${Math.min(22, 84 / round.letters.length)}vw, 7.5rem)` }}
          dir="rtl"
          role="group"
          aria-label="מילה בכתב רש״י — יש ללחוץ על האות א"
        >
          {round.letters.map((ch, i) => (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              disabled={solved}
              aria-label={solved && i === round.target ? "א — נמצאה" : `אות מספר ${i + 1}`}
              className={tileCls(tileState(i), true)}
            >
              <RashiLetter>{ch}</RashiLetter>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-5 ${round.letters.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}
          role="group"
          aria-label="אותיות בכתב רש״י — יש ללחוץ על האות א"
        >
          {round.letters.map((ch, i) => (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              disabled={solved}
              aria-label={solved && i === round.target ? "א — נמצאה" : `אות מספר ${i + 1}`}
              className={`text-6xl sm:text-7xl ${tileCls(tileState(i), false)}`}
            >
              <RashiLetter>{ch}</RashiLetter>
            </button>
          ))}
        </div>
      )}

      <Feedback tone={solved ? "positive" : "neutral"}>
        {solved ? copy.success : missed !== null ? copy.miss : " "}
      </Feedback>

      {/* Visual hint: the shape itself, nothing to read */}
      <div className="min-h-24 flex flex-col items-center justify-center gap-3">
        {hint && (
          <div
            className="flex items-center gap-4 rounded-2xl bg-paper border border-ochre-soft px-6 py-3 shadow-soft animate-settle"
            role="img"
            aria-label="תזכורת: כך נראית א בכתב רש״י"
          >
            <span className="text-sm text-ink-mute">הצורה שלה</span>
            <span className="text-6xl text-sepia">
              <RashiLetter>{TARGET_LETTER}</RashiLetter>
            </span>
          </div>
        )}
        {!hint && !solved && copy.hintButton && taps >= 1 && (
          <Button variant="ghost" size="sm" onClick={() => showHint(3200)} className="animate-fade-in">
            רמז
          </Button>
        )}
      </div>
    </Screen>
  );
}
