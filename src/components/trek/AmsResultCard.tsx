import * as React from "react";
import { SeverityBanner } from "../ui/severity-banner";
import { Button } from "../ui/button";
import { STANDARD_DISCLAIMER } from "@/lib/ams-copy";
import type { AmsResult } from "@/lib/types";

export interface AmsResultCardProps {
  result: AmsResult;
  onTriggerSos: () => void;
}

/** Shows exactly what evaluateAms() returned; no wording of its own. */
export function AmsResultCard({ result, onTriggerSos }: AmsResultCardProps) {
  const isDanger = result.level === "danger";

  return (
    <div className="space-y-4">
      <SeverityBanner
        severity={result.level === "ok" ? "info" : result.level}
        headline={result.headline}
        reasons={result.reasons}
        disclaimer={STANDARD_DISCLAIMER}
        actions={
          isDanger ? (
            <Button variant="sos" size="lg" className="mt-2 w-full" onClick={onTriggerSos}>
              Send SOS
            </Button>
          ) : undefined
        }
      />

      {result.actions.length > 0 && (
        <div className="space-y-2 rounded-[var(--radius)] border border-border bg-surface p-4">
          <h4 className="text-sm font-semibold text-text">What to do now</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-text-muted">
            {result.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
