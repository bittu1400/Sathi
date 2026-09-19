import * as React from "react";
import { cn } from "cn";

export type StatusTone = "neutral" | "ok" | "caution" | "warning" | "danger" | "sos" | "accent";

const soft: Record<StatusTone, string> = {
  neutral: "bg-surface-3 text-text border-line-strong",
  ok: "bg-ok-bg text-ok border-ok/40",
  caution: "bg-caution-bg text-caution border-caution/40",
  warning: "bg-warning-bg text-warning border-warning/40",
  danger: "bg-danger-bg text-danger border-danger/40",
  sos: "bg-sos-bg text-sos border-sos/40",
  accent: "bg-accent-bg text-accent border-accent/40",
};
const solid: Record<StatusTone, string> = {
  neutral: "bg-text text-ink border-transparent",
  ok: "bg-ok text-ink border-transparent",
  caution: "bg-caution text-ink border-transparent",
  warning: "bg-warning text-ink border-transparent",
  danger: "bg-danger text-ink border-transparent",
  sos: "bg-sos text-ink border-transparent",
  accent: "bg-accent text-ink border-transparent",
};

export interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  variant?: "soft" | "solid" | "outline";
  icon?: React.ReactNode;
  /** Dashed outline: data not yet verified (CLAUDE.md rule 6). */
  unverified?: boolean;
}

export function Status({ tone = "neutral", variant = "soft", icon, unverified, className, children, ...props }: StatusProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 text-label normal-case tracking-normal whitespace-nowrap [&_svg]:size-3.5",
        variant === "soft" && soft[tone],
        variant === "solid" && solid[tone],
        variant === "outline" && cn("bg-transparent", soft[tone].split(" ")[1]),
        variant === "outline" && "border-current",
        unverified && "border-dashed border-text-muted bg-surface-2 text-text-muted",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
