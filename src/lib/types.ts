/** Shapes shared between the facilitator API and the dashboard UI. */

export type ReflectionRow = {
  id: string;
  meeting_id: string | null;
  answer_1: string;
  answer_2: string;
  answer_3: string;
  initial_guess: string | null;
  initial_guess_correct: boolean | null;
  attempts_identification: number | null;
  completed_learning: boolean;
  created_at: string;
};

export type MeetingRow = {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  count: number;
};

export const QUESTIONS = [
  {
    key: "answer_1",
    prompt: "מה עזר לך לזהות את האות?",
    tab: "מה עזר לנו לזהות?",
  },
  {
    key: "answer_2",
    prompt: "באיזה רגע הרגשת שכבר “תפסת” אותה?",
    tab: "מתי הרגשנו שתפסנו?",
  },
  {
    key: "answer_3",
    prompt: "מה מהחוויה הזאת היית רוצה לתת גם לתלמידים שלך?",
    tab: "מה ניקח לתלמידים שלנו?",
  },
] as const;

export type AnswerKey = (typeof QUESTIONS)[number]["key"];
