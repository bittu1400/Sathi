import * as React from "react";
import { cn } from "cn";

export type BadgeVariant =
  | "neutral"
  | "ok"
  | "info"
  | "caution"
  | "warning"
  | "danger"
  | "unverified";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral: "bg-surface-3 text-text border-border",
    ok: "bg-ok/15 text-ok border-ok/30",
    info: "bg-info/15 text-info border-info/30",
    caution: "bg-caution/15 text-caution border-caution/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    unverified: "bg-surface-2 text-text-muted border-dashed border-text-muted/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
