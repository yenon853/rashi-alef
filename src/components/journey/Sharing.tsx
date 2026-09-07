"use client";

import { Button, Screen } from "@/components/ui";

export type SharingStatus = "saving" | "saved" | "failed";

export function Sharing({
  status,
  onRetry,
}: {
  status: SharingStatus;
  onRetry: () => void;
}) {
  if (status === "saving") {
    return (
      <Screen animKey="saving">
        <p className="font-display text-3xl text-ink-soft animate-drift">משתפים...</p>
      </Screen>
    );
  }

  if (status === "failed") {
    return (
      <Screen animKey="failed">
        <p className="font-display text-3xl sm:text-4xl leading-snug max-w-md">
          לא הצלחנו לשמור עדיין. אפשר לנסות שוב.
        </p>
        <p className="text-base text-ink-mute -mt-4">התשובות שלך שמורות כאן בינתיים.</p>
        <Button onClick={onRetry} className="min-w-48">
          ניסיון נוסף
        </Button>
      </Screen>
    );
  }

  return (
    <Screen animKey="saved">
      <p className="font-display text-3xl sm:text-4xl leading-snug max-w-md text-sepia">
        המחשבה שלך הצטרפה ללמידה של הקבוצה.
      </p>
      <p className="font-display text-2xl text-ink-soft">תודה.</p>
    </Screen>
  );
}
