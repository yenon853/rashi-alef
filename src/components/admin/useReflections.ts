"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MeetingRow, ReflectionRow } from "@/lib/types";

export type Range = "today" | "all";

export type Filter = {
  meeting: string; // meeting id or "all"
  range: Range;
};

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

type Loaded = {
  key: string; // which filter these rows belong to
  rows: ReflectionRow[];
  /** ids that arrived after the first load of this filter — they get an entrance animation */
  fresh: Set<string>;
};

/**
 * Loads reflections through the facilitator API and keeps them current
 * with light polling — new cards slide in without any page refresh.
 */
export function useReflections(filter: Filter) {
  const key = `${filter.meeting}|${filter.range}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const pendingAgain = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) {
      pendingAgain.current = true;
      return;
    }
    inFlight.current = true;
    try {
      const params = new URLSearchParams({ meeting: filter.meeting });
      if (filter.range === "today") params.set("since", startOfToday());
      const res = await fetch(`/api/admin/reflections?${params}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; rows?: ReflectionRow[]; message?: string };
      if (!res.ok || !data.ok || !data.rows) {
        throw new Error(data.message || "לא הצלחנו לטעון את המחשבות כרגע.");
      }
      const rows = data.rows;
      setLoaded((prev) => {
        const fresh = new Set<string>();
        if (prev && prev.key === key) {
          const known = new Set(prev.rows.map((r) => r.id));
          for (const r of rows) if (!known.has(r.id)) fresh.add(r.id);
          if (fresh.size === 0) for (const id of prev.fresh) if (known.has(id)) fresh.add(id);
        }
        return { key, rows, fresh };
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "לא הצלחנו לטעון את המחשבות כרגע.");
    } finally {
      inFlight.current = false;
      if (pendingAgain.current) {
        pendingAgain.current = false;
        void load();
      }
    }
  }, [filter.meeting, filter.range, key]);

  // (re)load whenever the filter changes
  useEffect(() => {
    void load();
  }, [load]);

  // live updates: gentle polling (every 4 s while the tab is visible)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 4000);
    return () => clearInterval(id);
  }, [load]);

  const current = loaded && loaded.key === key ? loaded : null;
  return {
    rows: current?.rows ?? [],
    fresh: current?.fresh ?? new Set<string>(),
    loading: !current && !error,
    error: current ? null : error,
    reload: load,
  };
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sessions", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; sessions?: MeetingRow[]; message?: string };
      if (!res.ok || !data.ok || !data.sessions) throw new Error(data.message);
      setMeetings(data.sessions);
      setError(null);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "לא הצלחנו לטעון את המפגשים כרגע.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const startNew = useCallback(
    async (title?: string) => {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title ?? "" }),
      });
      const data = (await res.json()) as { ok: boolean; session?: MeetingRow; message?: string };
      if (!res.ok || !data.ok || !data.session) {
        throw new Error(data.message || "לא הצלחנו לפתוח מפגש חדש כרגע.");
      }
      await load();
      return data.session;
    },
    [load],
  );

  const current = meetings.find((m) => !m.ended_at) ?? null;
  return { meetings, current, error, reload: load, startNew };
}
