import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-sm)] border border-line-strong bg-surface-2 px-1 font-mono text-label normal-case tracking-normal text-text-muted",
        className
      )}
      {...props}
    />
  );
}
