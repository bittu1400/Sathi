import * as React from "react";
import { cn } from "@/lib/utils";

/** Ridge-line glyph + wordmark, `currentColor`. */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-text", className)}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
        <path d="M2 19 9 6l4 7 2-3 7 9Z" />
      </svg>
      {showWordmark ? <span className="text-h2">Sathi</span> : <span className="sr-only">Sathi</span>}
    </span>
  );
}
