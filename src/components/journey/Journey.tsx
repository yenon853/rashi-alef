"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProgressDots } from "@/components/ui";
import { buildGuessOptions, buildRounds } from "@/lib/letters";
import {
  clearState,
  freshState,
  loadState,
  saveState,
  type JourneyState,
  type Step,
} from "@/lib/storage";
import { QUESTIONS } from "@/lib/types";
import { CompletionScreen } from "./CompletionScreen";
import { FirstGuess } from "./FirstGuess";
import { LearningIntro } from "./LearningIntro";
import { RecognitionRound } from "./RecognitionRound";
import { ReflectionStep } from "./ReflectionStep";
import { RevealLetter } from "./RevealLetter";
import { Sharing, type SharingStatus } from "./Sharing";
import { SuccessMoment } from "./SuccessMoment";
import { Transition } from "./Transition";

/** Learning steps that get a quiet progress dot. */
const DOT_STEPS: Step[] = ["guess", "reveal", "round-0", "round-1", "round-2", "round-3", "success"];

async function fetchCurrentMeeting(): Promise<string | null> {
  try {
    const res = await fetch("/api/session/current", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { meetingId?: string | null };
    return data.meetingId ?? null;
  } catch {
    return null;
  }
}

/** Sends the reflection to the server. Resolves true on success (or if it was already saved). */
async function saveReflection(state: JourneyState): Promise<boolean> {
  try {
    const res = await fetch("/api/reflections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: state.sessionId,
        meeting_id: state.meetingId,
        answer_1: state.answers[0],
        answer_2: state.answers[1],
        answer_3: state.answers[2],
        initial_guess: state.initialGuess,
        initial_guess_correct: state.initialGuessCorrect,
        attempts_identification: state.attempts,
      }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return res.ok && data.ok === true;
  } catch {
    return false;
  }
}

export function Journey() {
  // This component is loaded client-side only (see JourneyLoader), so the
  // saved journey can be read synchronously: a refresh never sends anyone back to the start.
  const [state, setState] = useState<JourneyState | null>(() => loadState() ?? freshState());
  const [sharing, setSharing] = useState<SharingStatus>("saving");
  const meetingRequested = useRef(false);

  // persist every change
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const update = useCallback((patch: Partial<JourneyState>) => {
    setState((s) => (s ? { ...s, ...patch } : s));
  }, []);

  const go = useCallback((step: Step) => update({ step }), [update]);

  // learn which meeting is open, once, as the journey starts
  useEffect(() => {
    if (!state || state.step === "intro" || state.meetingId || meetingRequested.current) return;
    meetingRequested.current = true;
    fetchCurrentMeeting().then((id) => {
      if (id) update({ meetingId: id });
    });
  }, [state, update]);

  const rounds = useMemo(() => (state ? buildRounds(state.sessionId) : []), [state?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const guessOptions = useMemo(
    () => (state ? buildGuessOptions(state.sessionId) : []),
    [state?.sessionId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // sharing: save when we enter the "sharing" step
  const share = useCallback(async () => {
    if (!state) return;
    setSharing("saving");
    const ok = await saveReflection(state);
    if (ok) {
      setSharing("saved");
      update({ completed: true, pending: false });
      setTimeout(() => go("done"), 2600);
    } else {
      setSharing("failed");
      update({ pending: true });
    }
  }, [state, update, go]);

  const shareStarted = useRef(false);
  useEffect(() => {
    if (state?.step === "sharing" && !shareStarted.current) {
      shareStarted.current = true;
      void share();
    }
    if (state?.step !== "sharing") shareStarted.current = false;
  }, [state?.step, share]);

  const onGuess = useCallback(
    (guess: string, correct: boolean) =>
      update({ initialGuess: guess, initialGuessCorrect: correct, step: "reveal" }),
    [update],
  );

  const solvedRound = useCallback(
    (index: number, attempts: number) => {
      setState((s) => {
        if (!s) return s;
        const next: Step = index === 3 ? "success" : (`round-${index + 1}` as Step);
        return { ...s, attempts: s.attempts + attempts, step: next };
      });
    },
    [],
  );

  const setAnswer = useCallback((i: number, value: string) => {
    setState((s) => {
      if (!s) return s;
      const answers = [...s.answers] as JourneyState["answers"];
      answers[i] = value;
      return { ...s, answers };
    });
  }, []);

  const restart = useCallback(() => {
    clearState();
    setState(freshState());
    meetingRequested.current = false;
  }, []);

  if (!state) {
    // first paint before hydration: keep the page calm and empty
    return <main className="flex-1" aria-busy="true" />;
  }

  const dotIndex = DOT_STEPS.indexOf(state.step);

  return (
    <>
      {dotIndex >= 0 && <ProgressDots total={DOT_STEPS.length} current={dotIndex} />}

      {state.step === "intro" && <LearningIntro onStart={() => go("guess")} />}

      {state.step === "guess" && <FirstGuess options={guessOptions} onGuess={onGuess} />}

      {state.step === "reveal" && <RevealLetter onNext={() => go("round-0")} />}

      {rounds.map(
        (round, i) =>
          state.step === `round-${i}` && (
            <RecognitionRound key={round.id} round={round} onSolved={(a) => solvedRound(i, a)} />
          ),
      )}

      {state.step === "success" && <SuccessMoment onNext={() => go("transition")} />}

      {state.step === "transition" && <Transition onNext={() => go("reflect-0")} />}

      {QUESTIONS.map(
        (q, i) =>
          state.step === `reflect-${i}` && (
            <ReflectionStep
              key={q.key}
              index={i}
              total={QUESTIONS.length}
              question={q.prompt}
              helper={i === 0 ? "אפשר לכתוב גם כמה מילים בלבד." : undefined}
              initial={state.answers[i]}
              submitLabel={i === QUESTIONS.length - 1 ? "שיתוף" : "המשך"}
              onChange={(v) => setAnswer(i, v)}
              onSubmit={(v) => {
                setAnswer(i, v);
                go(i === QUESTIONS.length - 1 ? "sharing" : (`reflect-${i + 1}` as Step));
              }}
            />
          ),
      )}

      {state.step === "sharing" && <Sharing status={sharing} onRetry={() => void share()} />}

      {state.step === "done" && <CompletionScreen onRestart={restart} />}
    </>
  );
}
