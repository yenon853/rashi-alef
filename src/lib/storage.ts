/**
 * Local persistence of the participant's journey.
 * A refresh mid-way must not send anyone back to the start,
 * and answers that failed to upload must never be lost.
 */

export type Step =
  | "intro"
  | "guess"
  | "reveal"
  | "round-0"
  | "round-1"
  | "round-2"
  | "round-3"
  | "success"
  | "transition"
  | "reflect-0"
  | "reflect-1"
  | "reflect-2"
  | "sharing"
  | "done";

export type JourneyState = {
  version: 1;
  sessionId: string; // anonymous participant id (UUID)
  meetingId: string | null; // the meeting that was open when the journey started
  step: Step;
  initialGuess: string | null;
  initialGuessCorrect: boolean | null;
  attempts: number; // total taps across the identification rounds (4 = flawless)
  answers: [string, string, string];
  completed: boolean; // reflection saved to the database
  pending: boolean; // answers ready but not yet saved (network problem)
  startedAt: string;
};

const KEY = "rashi-alef:journey:v1";

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // very old browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function freshState(): JourneyState {
  return {
    version: 1,
    sessionId: newSessionId(),
    meetingId: null,
    step: "intro",
    initialGuess: null,
    initialGuessCorrect: null,
    attempts: 0,
    answers: ["", "", ""],
    completed: false,
    pending: false,
    startedAt: new Date().toISOString(),
  };
}

export function loadState(): JourneyState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<JourneyState>;
    if (parsed.version !== 1 || typeof parsed.sessionId !== "string") return null;
    return { ...freshState(), ...parsed, version: 1 } as JourneyState;
  } catch {
    return null;
  }
}

export function saveState(state: JourneyState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private mode / quota — the journey still works in memory
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
