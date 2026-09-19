import * as React from "react";
import { cn } from "cn";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";

export type SeverityLevel = "info" | "caution" | "warning" | "danger" | "sos";

export interface SeverityBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  severity: SeverityLevel;
  headline: string;
  reasons?: string[];
  actions?: React.ReactNode;
  disclaimer?: string;
}

export function SeverityBanner({
  severity,
  headline,
  reasons,
  actions,
  disclaimer,
  className,
  ...props
}: SeverityBannerProps) {
  const styles: Record<
    SeverityLevel,
    { bg: string; border: string; text: string; icon: React.ReactNode }
  > = {
    info: {
      bg: "bg-info/10",
      border: "border-info/40",
      text: "text-info",
      icon: <Info className="w-5 h-5 shrink-0 text-info" />,
    },
    caution: {
      bg: "bg-caution/10",
      border: "border-caution/40",
      text: "text-caution",
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-caution" />,
    },
    warning: {
      bg: "bg-warning/15",
      border: "border-warning/50",
      text: "text-warning",
      icon: <AlertTriangle className="w-5 h-5 shrink-0 text-warning" />,
    },
    danger: {
      bg: "bg-danger/15",
      border: "border-danger/60",
      text: "text-danger",
      icon: <ShieldAlert className="w-6 h-6 shrink-0 text-danger animate-pulse" />,
    },
    sos: {
      bg: "bg-sos/20",
      border: "border-sos",
      text: "text-sos",
      icon: <ShieldAlert className="w-6 h-6 shrink-0 text-sos animate-pulse" />,
    },
  };

  const current = styles[severity];
  const isAssertive = severity === "warning" || severity === "danger" || severity === "sos";

  return (
    <div
      role="alert"
      aria-live={isAssertive ? "assertive" : "polite"}
      className={cn(
        "p-4 rounded-[var(--radius)] border flex flex-col gap-3 transition-colors",
        current.bg,
        current.border,
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {current.icon}
        <div className="flex-1 space-y-1">
          <h4 className={cn("font-semibold text-base leading-tight", current.text)}>
            {headline}
          </h4>
          {reasons && reasons.length > 0 && (
            <ul className="text-sm text-text-muted space-y-1 mt-2 list-disc list-inside">
              {reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {actions && <div className="pt-2 border-t border-border/40 flex items-center gap-2 flex-wrap">{actions}</div>}

      {disclaimer && (
        <p className="text-xs text-text-faint italic">{disclaimer}</p>
      )}
    </div>
  );
}
