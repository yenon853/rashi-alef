"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "@/lib/types";
import { AnswerCard, EmptyState, ErrorState, LoadingState, RepeatedWords, Segmented } from "./pieces";
import { ProjectionMode, type ProjectionView } from "./ProjectionMode";
import { useMeetings, useReflections, type Range } from "./useReflections";
import { WordCloud } from "./WordCloud";

type ContentView = "cards" | "cloud";

function formatMeeting(title: string, iso: string): string {
  const d = new Date(iso);
  return `${title} · ${d.toLocaleDateString("he-IL", { day: "numeric", month: "short" })}`;
}

export function AdminDashboard() {
  const router = useRouter();
  const meetings = useMeetings();

  const [meeting, setMeeting] = useState<string>("current");
  const [range, setRange] = useState<Range>("today");
  const [question, setQuestion] = useState(0);
  const [content, setContent] = useState<ContentView>("cards");
  const [wall, setWall] = useState(false);
  const [projection, setProjection] = useState<ProjectionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const meetingId =
    meeting === "current" ? (meetings.current?.id ?? "all") : meeting;
  const data = useReflections({ meeting: meetingId, range });

  const q = QUESTIONS[question];
  const answerRows = useMemo(
    () => data.rows.filter((r) => r[q.key] && r[q.key].trim()),
    [data.rows, q.key],
  );
  const answers = useMemo(() => answerRows.map((r) => r[q.key]), [answerRows, q.key]);

  // stats
  const participants = data.rows.length;
  const completed = data.rows.filter((r) => r.completed_learning).length;
  const guessed = data.rows.filter((r) => r.initial_guess_correct !== null);
  const guessedRight = guessed.filter((r) => r.initial_guess_correct).length;
  const attempts = data.rows.map((r) => r.attempts_identification).filter((n): n is number => typeof n === "number");
  const avgAttempts = attempts.length ? attempts.reduce((a, b) => a + b, 0) / attempts.length : null;
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

  async function startNewMeeting() {
    if (busy) return;
    const ok = window.confirm("לפתוח מפגש חדש? התשובות הקודמות נשמרות, והמפגש הנוכחי ייסגר.");
    if (!ok) return;
    setBusy(true);
    try {
      await meetings.startNew();
      setMeeting("current");
      setRange("today");
      setNotice("נפתח מפגש חדש. המשתתפים החדשים יצטרפו אליו.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "לא הצלחנו לפתוח מפגש חדש כרגע.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  // lock page scroll while an overlay is open
  useEffect(() => {
    document.body.style.overflow = wall || projection ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [wall, projection]);

  const stats = [
    { label: "משתתפים", value: participants, hint: "שמרו רפלקציה" },
    { label: "השלימו את הלמידה", value: completed, hint: pct(completed, participants) },
    { label: "ניחשו נכון בפעם הראשונה", value: pct(guessedRight, guessed.length), hint: guessed.length ? `${guessedRight} מתוך ${guessed.length}` : "" },
    { label: "מספר ניסיונות ממוצע", value: avgAttempts === null ? "—" : avgAttempts.toFixed(1), hint: "לחיצות בארבע משימות הזיהוי (4 = בלי אף טעות)" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="me-auto flex items-baseline gap-3">
            <span className="font-display text-2xl font-medium">החוויה של הקבוצה</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-sage" title="מתעדכן אוטומטית">
              <span className="h-2 w-2 rounded-full bg-sage animate-drift" />
              מתעדכן בזמן אמת
            </span>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            מפגש
            <select
              value={meeting}
              onChange={(e) => {
                setMeeting(e.target.value);
                if (e.target.value !== "current") setRange("all");
              }}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-base text-ink outline-none focus:border-ochre max-w-56"
            >
              <option value="current">
                {meetings.current ? formatMeeting(meetings.current.title, meetings.current.started_at) : "המפגש הנוכחי"}
              </option>
              <option value="all">כל המפגשים</option>
              {meetings.meetings
                .filter((m) => m.ended_at)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatMeeting(m.title, m.started_at)} ({m.count})
                  </option>
                ))}
            </select>
          </label>

          <Segmented
            label="טווח זמן"
            value={range}
            onChange={setRange}
            options={[
              { value: "today", label: "היום" },
              { value: "all", label: "כל התשובות" },
            ]}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWall(true)}
              className="rounded-full border border-line bg-paper px-4 py-1.5 text-base hover:border-ochre transition-colors"
            >
              קיר המחשבות
            </button>
            <button
              type="button"
              onClick={() => setProjection("wall")}
              className="rounded-full bg-ink text-cream px-4 py-1.5 text-base hover:bg-sepia transition-colors"
            >
              מצב הקרנה
            </button>
            <button
              type="button"
              onClick={startNewMeeting}
              disabled={busy}
              className="rounded-full border border-line bg-paper px-4 py-1.5 text-base hover:border-ochre transition-colors disabled:opacity-50"
            >
              {busy ? "פותחים..." : "התחלת מפגש חדש"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full px-3 py-1.5 text-sm text-ink-mute hover:text-ink transition-colors"
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <p role="status" className="mx-auto mt-4 rounded-full bg-sage-tint text-ink px-5 py-2 text-base animate-fade-in">
          {notice}
        </p>
      )}
      {meetings.error && (
        <p role="alert" className="mx-auto mt-4 rounded-full bg-ochre-tint text-sepia px-5 py-2 text-base">
          {meetings.error}
        </p>
      )}

      <main className="mx-auto w-full max-w-7xl px-5 py-8 flex flex-col gap-10">
        {/* ---------- stat cards ---------- */}
        <section aria-label="נתוני הקבוצה" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-card bg-paper border border-line/70 shadow-soft px-6 py-5 flex flex-col gap-1">
              <span className="text-base text-ink-soft">{s.label}</span>
              <span className="font-display text-5xl font-medium leading-none mt-1">{s.value}</span>
              {s.hint && <span className="text-sm text-ink-mute mt-1">{s.hint}</span>}
            </div>
          ))}
        </section>

        {/* ---------- question tabs ---------- */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div role="tablist" aria-label="שאלות הרפלקציה" className="flex flex-wrap gap-2">
              {QUESTIONS.map((qq, i) => {
                const active = i === question;
                return (
                  <button
                    key={qq.key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setQuestion(i)}
                    className={`rounded-full px-5 py-2.5 text-lg font-display transition-colors border ${
                      active
                        ? "bg-ink text-cream border-ink"
                        : "bg-paper text-ink-soft border-line hover:border-ochre hover:text-ink"
                    }`}
                  >
                    {qq.tab}
                  </button>
                );
              })}
            </div>
            <Segmented
              label="תצוגה"
              value={content}
              onChange={setContent}
              options={[
                { value: "cards", label: "כרטיסים" },
                { value: "cloud", label: "ענן מילים" },
              ]}
            />
          </div>

          {data.loading ? (
            <LoadingState />
          ) : data.error ? (
            <ErrorState message={data.error} onRetry={() => void data.reload()} />
          ) : answerRows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {content === "cards" ? (
                <div className="columns-1 md:columns-2 xl:columns-3 gap-5">
                  {answerRows.map((r, i) => (
                    <AnswerCard key={r.id} id={r.id} text={r[q.key]} index={i} fresh={data.fresh.has(r.id)} />
                  ))}
                </div>
              ) : (
                <div className="rounded-card bg-paper border border-line/70 shadow-soft p-4">
                  <WordCloud answers={answers} />
                </div>
              )}
              <RepeatedWords answers={answers} />
            </>
          )}
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-sm text-ink-mute">
        <Link href="/" className="hover:text-ink-soft underline-offset-4 hover:underline">
          לחוויה של המשתתפים
        </Link>
      </footer>

      {/* ---------- thought wall (full screen, still with a slim bar) ---------- */}
      {wall && !projection && (
        <div className="fixed inset-0 z-40 bg-cream flex flex-col animate-fade-in" role="dialog" aria-label="קיר המחשבות">
          <div className="shrink-0 flex flex-wrap items-center gap-3 px-6 py-4 border-b border-line/60">
            <h2 className="font-display text-3xl me-auto">{q.tab}</h2>
            <div role="tablist" className="flex gap-2">
              {QUESTIONS.map((qq, i) => (
                <button
                  key={qq.key}
                  role="tab"
                  type="button"
                  aria-selected={i === question}
                  onClick={() => setQuestion(i)}
                  className={`h-10 w-10 rounded-full border text-lg ${
                    i === question ? "bg-ink text-cream border-ink" : "bg-paper border-line hover:border-ochre"
                  }`}
                  aria-label={qq.tab}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setProjection("wall")}
              className="rounded-full bg-ink text-cream px-4 py-2 hover:bg-sepia transition-colors"
            >
              מצב הקרנה
            </button>
            <button
              type="button"
              onClick={() => setWall(false)}
              className="rounded-full border border-line bg-paper px-4 py-2 hover:border-ochre transition-colors"
            >
              סגירה
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto quiet-scroll px-6 py-6">
            {answerRows.length === 0 ? (
              <EmptyState big />
            ) : (
              <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-6">
                {answerRows.map((r, i) => (
                  <AnswerCard key={r.id} id={r.id} text={r[q.key]} size="lg" index={i} fresh={data.fresh.has(r.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- projection ---------- */}
      {projection && (
        <ProjectionMode
          rows={data.rows}
          fresh={data.fresh}
          question={question}
          view={projection}
          onQuestion={setQuestion}
          onView={setProjection}
          onExit={() => setProjection(null)}
        />
      )}
    </div>
  );
}
