import * as React from "react";
import { cn } from "cn";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    text: string;
    severity?: "ok" | "info" | "caution" | "warning" | "danger";
  };
  size?: "md" | "lg";
}

export function Stat({
  label,
  value,
  unit,
  delta,
  size = "md",
  className,
  ...props
}: StatProps) {
  const severityColors = {
    ok: "text-ok",
    info: "text-info",
    caution: "text-caution",
    warning: "text-warning",
    danger: "text-danger",
  };

  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
        <span
          className={cn(
            "font-semibold text-text tracking-tight",
            size === "lg" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
          )}
        >
          {value}
        </span>
        {unit && <span className="text-base text-text-muted font-sans">{unit}</span>}
      </div>
      {delta && (
        <span
          className={cn(
            "text-xs font-mono font-medium",
            delta.severity ? severityColors[delta.severity] : "text-text-muted"
          )}
        >
          {delta.text}
        </span>
      )}
    </div>
  );
}
