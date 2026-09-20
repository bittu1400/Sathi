import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        // 40 px visible, 48 px hit area via the pseudo-element.
        "relative inline-flex min-h-10 cursor-pointer select-none items-center gap-1.5 rounded-[var(--radius)] border px-3 text-small font-medium transition-colors duration-[var(--dur-fast)] before:absolute before:-inset-1 before:content-['']",
        selected
          ? "border-accent bg-accent-bg text-accent"
          : "border-control-border bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ChipGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}
