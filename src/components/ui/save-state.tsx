import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, TriangleAlert } from "lucide-react";

export type SaveStateValue = "idle" | "saving" | "saved" | "queued" | "error";

/**
 * Inline status next to a submit button. Every Supabase write checks `error`;
 * never show "saved" for a failed write.
 */
export function SaveState({ state, onRetry, className }: { state: SaveStateValue; onRetry?: () => void; className?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex min-h-6 items-center gap-1.5 text-small", className)}>
      {state === "saving" && (
        <>
          <Loader2 className="size-4 animate-spin text-text-muted" aria-hidden /> <span className="text-text-muted">Saving…</span>
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-4 text-ok" aria-hidden /> <span className="text-ok">Saved</span>
        </>
      )}
      {state === "queued" && <span className="text-caution">Queued — sends when you&apos;re online</span>}
      {state === "error" && (
        <>
          <TriangleAlert className="size-4 text-danger" aria-hidden />
          <span className="text-danger">Couldn&apos;t save</span>
          {onRetry && (
            <button type="button" onClick={onRetry} className="cursor-pointer font-medium text-accent hover:underline">
              — Retry
            </button>
          )}
        </>
      )}
    </span>
  );
}
