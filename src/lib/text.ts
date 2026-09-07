/**
 * Plain, honest text statistics for the facilitator panel.
 * Counts only words that participants actually wrote — nothing is invented.
 */

/** Common Hebrew function words that carry no meaning on a wall or cloud. */
export const STOP_WORDS = new Set<string>([
  // the list from the brief
  "של", "את", "על", "עם", "גם", "אני", "זה", "זו", "היה", "היא", "כי", "מה", "לי", "שלי", "יותר",
  // a few equally empty function words
  "לא", "או", "אם", "אז", "רק", "כל", "הוא", "הם", "הן", "יש", "אין", "כך", "ככה", "כמו",
  "אבל", "אותה", "אותו", "אותם", "עוד", "כבר", "מאוד", "אל", "עד", "בין", "כאן", "שם", "לו", "לה",
  "אחרי", "לפני", "אחר", "כדי", "משהו", "ואז", "וגם", "וזה", "שזה", "בזה", "הזה", "הזאת", "זאת",
  "היו", "הייתי", "היית", "לנו", "שלנו", "אנחנו", "אתה", "היתה", "הייתה", "מי", "איך", "למה", "האם",
  "בתוך", "מתוך", "לתוך", "בכל", "ובכל", "ליד", "מול", "לפי", "בלי", "ללא", "בגלל", "למרות", "כאשר",
  "כלפי", "לגבי", "אצל", "מאז", "בזמן", "אפילו", "בעצם", "ממש", "פשוט", "בערך",
]);

const PUNCTUATION = /[\p{P}\p{S}֑-ׇ‎‏"'״׳“”‘’…]+/gu;

/** Splits Hebrew (or mixed) text into cleaned lower-case tokens. */
export function tokenize(text: string): string[] {
  return text
    .replace(PUNCTUATION, " ")
    .split(/\s+/u)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

export type WordCount = { word: string; count: number };

/**
 * Counts in how many ANSWERS each word appears (document frequency):
 * a word repeated ten times in one answer counts once —
 * "the more answers a word returns in, the bigger it is".
 */
export function wordFrequencies(answers: string[]): WordCount[] {
  const counts = new Map<string, number>();
  for (const answer of answers) {
    const unique = new Set(tokenize(answer));
    for (const w of unique) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "he"));
}

/** 5–8 words that came back in more than one answer (or the top few when the group is small). */
export function repeatedWords(answers: string[]): WordCount[] {
  const freq = wordFrequencies(answers);
  const repeated = freq.filter((f) => f.count >= 2);
  if (repeated.length >= 5) return repeated.slice(0, 8);
  return freq.slice(0, Math.min(8, Math.max(repeated.length, Math.min(5, freq.length))));
}
