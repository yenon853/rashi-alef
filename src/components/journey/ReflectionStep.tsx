"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Screen } from "@/components/ui";

export function ReflectionStep({
  index,
  total,
  question,
  helper,
  initial,
  submitLabel,
  onChange,
  onSubmit,
}: {
  index: number;
  total: number;
  question: string;
  helper?: string;
  initial: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSubmit = value.trim().length > 0;

  // focus the field once the screen has settled (not on tiny screens where the keyboard would jump)
  useEffect(() => {
    const t = setTimeout(() => {
      if (window.matchMedia("(min-width: 640px)").matches) ref.current?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <Screen animKey={`reflect-${index}`}>
      <p className="text-sm tracking-wide text-ink-mute" aria-label={`שאלה ${index + 1} מתוך ${total}`}>
        {index + 1} מתוך {total}
      </p>

      <label htmlFor="reflection" className="font-display text-3xl sm:text-4xl font-medium leading-snug">
        {question}
      </label>

      <div className="w-full">
        <textarea
          id="reflection"
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          rows={5}
          maxLength={2000}
          placeholder=" "
          className="w-full resize-none rounded-card border border-line bg-paper px-5 py-4 text-xl leading-relaxed shadow-soft outline-none transition-[border-color,box-shadow] duration-200 focus:border-ochre focus:shadow-lift"
        />
        {helper && <p className="mt-3 text-base text-ink-mute">{helper}</p>}
      </div>

      <Button
        onClick={() => onSubmit(value.trim())}
        disabled={!canSubmit}
        className="min-w-44"
      >
        {submitLabel}
      </Button>
    </Screen>
  );
}
