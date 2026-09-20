"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Progress as RadixProgress } from "radix-ui";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 role="status" aria-label="Loading" className={cn("size-5 animate-spin text-text-muted", className)} />;
}

/** `valueText` is announced with the bar, e.g. "42% of 38 MB". */
export function Progress({ value, valueText, className }: { value: number; valueText?: string; className?: string }) {
  return (
    <RadixProgress.Root
      value={value}
      aria-valuetext={valueText ?? `${Math.round(value)}%`}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <RadixProgress.Indicator className="h-full bg-accent transition-[width] duration-[var(--dur)]" style={{ width: `${value}%` }} />
    </RadixProgress.Root>
  );
}
