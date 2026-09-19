"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatAgo } from "@/lib/format";
import { useNow } from "@/lib/use-now";

/** Re-fetches the server page every 60 s, but not while the tab is hidden. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const timer = setInterval(() => document.visibilityState === "visible" && router.refresh(), seconds * 1000);
    const onVisible = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, seconds]);
  return null;
}

/** "12 min ago" that keeps ticking between refreshes. */
export function LiveAgo({ iso }: { iso: string }) {
  const now = useNow();
  return <time dateTime={iso}>{now === null ? "" : formatAgo(iso, now)}</time>;
}
