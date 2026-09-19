import * as React from "react";
import { cn } from "cn";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";

export type SeverityLevel = "info" | "caution" | "warning" | "danger" | "sos";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  severity: SeverityLevel;
  headline: string;
  reasons?: string[];
  actions?: React.ReactNode;
  disclaimer?: string;
}

const styles: Record<SeverityLevel, { box: string; text: string; Icon: typeof Info }> = {
  info: { box: "bg-accent-bg border-l-accent", text: "text-accent", Icon: Info },
  caution: { box: "bg-caution-bg border-l-caution", text: "text-caution", Icon: AlertCircle },
  warning: { box: "bg-warning-bg border-l-warning", text: "text-warning", Icon: AlertTriangle },
  danger: { box: "bg-danger-bg border-l-danger", text: "text-danger", Icon: ShieldAlert },
  sos: { box: "bg-sos-bg border-l-sos", text: "text-sos", Icon: ShieldAlert },
};

/** Safety wording comes in through props from `ams-copy.ts`; this component holds none. */
export function Banner({ severity, headline, reasons, actions, disclaimer, className, children, ...props }: BannerProps) {
  const { box, text, Icon } = styles[severity];
  const assertive = severity === "warning" || severity === "danger" || severity === "sos";
  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cn("flex flex-col gap-3 rounded-[var(--radius)] border border-line border-l-[3px] p-4", box, className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", text)} strokeWidth={1.75} aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className={cn("text-body font-semibold", text)}>{headline}</h4>
          {reasons && reasons.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-small text-text-muted">
              {reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}
          {children}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">{actions}</div>}
      {disclaimer && <p className="text-small text-text-muted">{disclaimer}</p>}
    </div>
  );
}
