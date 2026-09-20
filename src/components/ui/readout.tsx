import * as React from "react";
import { cn } from "@/lib/utils";

export interface ReadoutProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { text: string; severity?: "ok" | "info" | "caution" | "warning" | "danger" };
  size?: "xl" | "md" | "sm";
  /** e.g. "updated 3 min ago"; pass `stale` to render it in caution. */
  freshness?: string;
  stale?: boolean;
}

const tone = { ok: "text-ok", info: "text-accent", caution: "text-caution", warning: "text-warning", danger: "text-danger" };
const valueSize = { xl: "text-readout-xl", md: "text-readout", sm: "font-mono text-h2 tabular-nums" };

export function Readout({ label, value, unit, delta, size = "md", freshness, stale, className, ...props }: ReadoutProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)} {...props}>
      <span className="text-label text-text-muted">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-text", valueSize[size])}>{value}</span>
        {unit && <span className={cn("font-mono text-text-muted", size === "xl" ? "text-h2" : "text-small")}>{unit}</span>}
      </div>
      {delta && (
        <span className={cn("font-mono text-small tabular-nums", delta.severity ? tone[delta.severity] : "text-text-muted")}>
          {delta.text}
        </span>
      )}
      {freshness && <span className={cn("text-small", stale ? "text-caution" : "text-text-muted")}>{freshness}</span>}
    </div>
  );
}
