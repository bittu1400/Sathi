import * as React from "react";
import { cn } from "cn";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({
  selected = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer min-h-[36px] select-none",
        selected
          ? "bg-accent/15 border-accent text-accent"
          : "bg-surface-2 border-border text-text-muted hover:bg-surface-3 hover:text-text",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ChipGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}
