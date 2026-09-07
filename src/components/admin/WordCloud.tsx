"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { seededRandom } from "@/lib/letters";
import { wordFrequencies, type WordCount } from "@/lib/text";

type Placed = { word: string; count: number; x: number; y: number; size: number; color: string };

const COLORS = ["#2a2420", "#6b4a2b", "#2f3b5c", "#6f8a72", "#b8903f"];

function layout(words: WordCount[], width: number, height: number, big: boolean): Placed[] {
  if (typeof document === "undefined" || words.length === 0 || width < 50) return [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;
  const minSize = big ? Math.max(20, width / 60) : Math.max(15, width / 70);
  const maxSize = big ? Math.min(width / 7, height / 4) : Math.min(width / 9, height / 4, 88);
  const rnd = seededRandom(words.length * 7919 + width);

  const placed: Placed[] = [];
  const rects: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const t = maxCount === minCount ? 0.55 : (w.count - minCount) / (maxCount - minCount);
    const size = Math.round(minSize + (maxSize - minSize) * Math.pow(t, 0.8));
    ctx.font = `${size >= (minSize + maxSize) / 2 ? 700 : 500} ${size}px Heebo, Arial, sans-serif`;
    const tw = ctx.measureText(w.word).width + size * 0.35;
    const th = size * 1.15;

    let angle = rnd() * Math.PI * 2;
    let radius = 0;
    let x = cx;
    let y = cy;
    let ok = false;
    for (let step = 0; step < 600; step++) {
      const x1 = x - tw / 2;
      const y1 = y - th / 2;
      const x2 = x + tw / 2;
      const y2 = y + th / 2;
      const inside = x1 >= 4 && y1 >= 4 && x2 <= width - 4 && y2 <= height - 4;
      const clash = rects.some((r) => !(x2 < r.x1 || x1 > r.x2 || y2 < r.y1 || y1 > r.y2));
      if (inside && !clash) {
        rects.push({ x1, y1, x2, y2 });
        ok = true;
        break;
      }
      angle += 0.35;
      radius += 1.6 * (big ? 1.4 : 1);
      x = cx + radius * Math.cos(angle) * 1.25;
      y = cy + radius * Math.sin(angle) * 0.8;
    }
    if (ok) placed.push({ word: w.word, count: w.count, x, y, size, color: COLORS[i % COLORS.length] });
  }
  return placed;
}

export function WordCloud({
  answers,
  big = false,
  className = "",
}: {
  answers: string[];
  /** projection sizing */
  big?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const words = useMemo(() => wordFrequencies(answers).slice(0, 60), [answers]);
  const placed = useMemo(() => layout(words, box.w, box.h, big), [words, box.w, box.h, big]);

  return (
    <div
      ref={ref}
      className={`relative w-full ${big ? "h-full" : "h-[26rem]"} ${className}`}
      role="img"
      aria-label={
        words.length
          ? `ענן מילים: ${words.slice(0, 12).map((w) => `${w.word} (${w.count})`).join(", ")}`
          : "אין עדיין מילים להצגה"
      }
    >
      {box.w > 0 && (
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="block">
          {placed.map((p, i) => (
            <text
              key={p.word}
              x={p.x}
              y={p.y}
              fontSize={p.size}
              fontFamily="Heebo, Arial, sans-serif"
              fontWeight={p.size > 40 ? 700 : 500}
              fill={p.color}
              textAnchor="middle"
              dominantBaseline="central"
              direction="rtl"
              className="animate-fade-in"
              style={{ animationDelay: `${Math.min(i * 40, 1200)}ms` }}
            >
              {p.word}
            </text>
          ))}
        </svg>
      )}
      {words.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-ink-mute text-lg">
          כשיהיו מילים שחוזרות, הן יופיעו כאן.
        </p>
      )}
    </div>
  );
}
