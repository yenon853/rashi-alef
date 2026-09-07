/**
 * Content of the learning journey.
 * One letter: א. Everything below serves recognizing it — nothing more.
 */

export const TARGET_LETTER = "א";

/** Options for the first guess (shown in regular print letters). */
export const GUESS_OPTIONS = ["א", "ח", "ת"] as const;

export type Round = {
  id: "find" | "context" | "context2" | "retrieval";
  /** Letters shown, in reading order (right → left). */
  letters: string[];
  /** Index of א inside `letters`. */
  target: number;
  /** Whether the letters form a word (displayed as one word) or separate tiles. */
  asWord: boolean;
  /** Whether a visual hint may be offered after a miss. */
  hint: boolean;
};

/** Small deterministic PRNG (mulberry32) so a refresh keeps the same layout. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function tilesRound(id: Round["id"], distractors: string[], rnd: () => number, hint = false): Round {
  const letters = shuffle([TARGET_LETTER, ...distractors], rnd);
  return { id, letters, target: letters.indexOf(TARGET_LETTER), asWord: false, hint };
}

function wordRound(id: Round["id"], word: string, hint: boolean): Round {
  const letters = Array.from(word);
  return { id, letters, target: letters.indexOf(TARGET_LETTER), asWord: true, hint };
}

/** Builds the four identification rounds for a given participant seed. */
export function buildRounds(seed: string): Round[] {
  const rnd = seededRandom(hashSeed(seed));
  return [
    // 4. first recognition — four separate letters
    tilesRound("find", ["ש", "ע", "ת"], rnd, true),
    // 5. in context — a short word, א in the middle
    wordRound("context", "ראש", false),
    // 6. a different context — longer word, hint allowed after one miss
    wordRound("context2", "בראשית", true),
    // 7. retrieval challenge — six letters, no help
    tilesRound("retrieval", ["ה", "צ", "ש", "ע", "ת"], rnd, false),
  ];
}

export function buildGuessOptions(seed: string): string[] {
  const rnd = seededRandom(hashSeed(seed + ":guess"));
  return shuffle(GUESS_OPTIONS, rnd);
}
