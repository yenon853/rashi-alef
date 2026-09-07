"use client";

import dynamic from "next/dynamic";

/**
 * The journey depends on localStorage (saved progress), so it renders on the
 * client only. Until it loads, the page stays calm and empty.
 */
const Journey = dynamic(() => import("./Journey").then((m) => m.Journey), {
  ssr: false,
  loading: () => <main className="flex-1" aria-busy="true" />,
});

export function JourneyLoader() {
  return <Journey />;
}
