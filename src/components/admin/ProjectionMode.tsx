"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QUESTIONS, type ReflectionRow } from "@/lib/types";
import { AnswerCard, EmptyState, RepeatedWords, tintFor } from "./pieces";
import { WordCloud } from "./WordCloud";

export type ProjectionView = "wall" | "single" | "cloud";

/**
 * Full-screen, 16:9-friendly projection.
 * Keyboard: ←/→ switch question (in "single": switch answer, ↑/↓ switch question),
 * 1/2/3 jump to a question, W/S/C switch view, Esc exits.
 * Everything technical is hidden; controls appear only when the mouse moves.
 */
export function ProjectionMode({
  rows,
  fresh,
  question,
  view,
  onQuestion,
  onView,
  onExit,
}: {
  rows: ReflectionRow[];
  fresh: Set<string>;
  question: number;
  view: ProjectionView;
  onQuestion: (i: number) => void;
  onView: (v: ProjectionView) => void;
  onExit: () => void;
}) {
  const q = QUESTIONS[question];
  const answers = rows.map((r) => r[q.key]).filter((t) => t && t.trim());
  const [single, setSingle] = useState(0);
  const [chrome, setChrome] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // controls fade away when the mouse rests
  const poke = useCallback(() => {
    setChrome(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChrome(false), 2600);
  }, []);

  useEffect(() => {
    // controls start visible, then rest
    hideTimer.current = setTimeout(() => setChrome(false), 2600);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // try to go fullscreen; fall back silently
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // keep the single index valid as answers arrive / the question changes
  const safeSingle = answers.length ? Math.min(single, answers.length - 1) : 0;
  const singleRow = rows.filter((r) => r[q.key] && r[q.key].trim())[safeSingle];

  // keyboard
  useEffect(() => {
    const step = (d: number) => onQuestion((question + d + QUESTIONS.length) % QUESTIONS.length);
    const stepSingle = (d: number) =>
      setSingle(answers.length ? (safeSingle + d + answers.length) % answers.length : 0);
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onExit();
          break;
        // in RTL the "next" direction is to the left
        case "ArrowLeft":
          e.preventDefault();
          if (view === "single") stepSingle(1);
          else step(1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (view === "single") stepSingle(-1);
          else step(-1);
          break;
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          step(1);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          step(-1);
          break;
        case " ":
          e.preventDefault();
          if (view === "single") stepSingle(1);
          break;
        case "1":
        case "2":
        case "3":
          onQuestion(Number(e.key) - 1);
          break;
        case "w":
        case "W":
          onView("wall");
          break;
        case "s":
        case "S":
          onView("single");
          break;
        case "c":
        case "C":
          onView("cloud");
          break;
        default:
          return;
      }
      poke();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [question, view, answers.length, safeSingle, onQuestion, onView, onExit, poke]);

  return (
    <div
      className="projection fixed inset-0 z-50 bg-cream text-ink flex flex-col overflow-hidden"
      onMouseMove={poke}
      onTouchStart={poke}
      role="region"
      aria-label="מצב הקרנה"
    >
      {/* question header */}
      <header className="shrink-0 px-[4vw] pt-[3vh] pb-[1.5vh] flex items-end justify-between gap-6">
        <h1 className="font-display font-medium leading-tight text-[clamp(2rem,4.2vw,4.4rem)]">
          {q.tab}
        </h1>
        <div className="flex gap-2 pb-3" aria-label={`שאלה ${question + 1} מתוך 3`} role="img">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                i === question ? "w-10 bg-ink" : "w-4 bg-line"
              }`}
            />
          ))}
        </div>
      </header>

      {/* body */}
      <div className="flex-1 min-h-0 px-[4vw] pb-[3vh]">
        {answers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState big />
          </div>
        ) : view === "wall" ? (
          <div className="h-full overflow-y-auto quiet-scroll columns-2 xl:columns-3 2xl:columns-4 gap-6">
            {rows
              .filter((r) => r[q.key] && r[q.key].trim())
              .map((r, i) => (
                <AnswerCard key={r.id} id={r.id} text={r[q.key]} size="xl" index={i} fresh={fresh.has(r.id)} />
              ))}
          </div>
        ) : view === "single" && singleRow ? (
          <div className="h-full flex flex-col items-center justify-center gap-[3vh]">
            <blockquote
              key={singleRow.id}
              className={`max-w-[80vw] rounded-[2rem] border border-line/60 px-[5vw] py-[5vh] text-center font-display leading-snug text-[clamp(2rem,4.6vw,5.2rem)] animate-settle ${tintFor(singleRow.id)}`}
            >
              {singleRow[q.key]}
            </blockquote>
            <p className="text-ink-mute text-[clamp(1rem,1.4vw,1.5rem)]" aria-live="polite">
              {safeSingle + 1} מתוך {answers.length}
            </p>
          </div>
        ) : (
          <div className="h-full grid grid-rows-[1fr_auto] gap-[2vh]">
            <WordCloud answers={answers} big />
            <RepeatedWords answers={answers} big />
          </div>
        )}
      </div>

      {/* controls: visible only while the mouse moves */}
      <div
        className={`absolute bottom-5 inset-x-0 flex justify-center transition-opacity duration-500 ${
          chrome ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!chrome}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-full bg-ink/90 text-cream backdrop-blur px-3 py-2 shadow-lift text-base">
          {(
            [
              ["wall", "קיר"],
              ["single", "תשובה אחת"],
              ["cloud", "ענן מילים"],
            ] as [ProjectionView, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                view === v ? "bg-cream text-ink" : "hover:bg-cream/15"
              }`}
              aria-pressed={view === v}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-cream/30" aria-hidden />
          {view === "single" && answers.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSingle((safeSingle - 1 + answers.length) % answers.length)}
                className="rounded-full px-3 py-1.5 hover:bg-cream/15"
                aria-label="התשובה הקודמת"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => setSingle((safeSingle + 1) % answers.length)}
                className="rounded-full px-3 py-1.5 hover:bg-cream/15"
                aria-label="התשובה הבאה"
              >
                ←
              </button>
              <span className="mx-1 h-5 w-px bg-cream/30" aria-hidden />
            </>
          )}
          <span className="text-cream/60 text-sm px-2 hidden md:inline">חצים: מעבר · 1/2/3: שאלה · Esc: יציאה</span>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full border border-cream/40 px-4 py-1.5 hover:bg-cream hover:text-ink transition-colors"
          >
            יציאה ממצב הקרנה
          </button>
        </div>
      </div>
    </div>
  );
}
