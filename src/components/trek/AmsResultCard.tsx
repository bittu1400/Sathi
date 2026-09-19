import * as React from "react";
import { SeverityBanner } from "../ui/severity-banner";
import { Button } from "../ui/button";

export interface AmsResultCardProps {
  severity: "ok" | "info" | "caution" | "warning" | "danger";
  headline: string;
  reasons: string[];
  actions: string[];
  onTriggerSos?: () => void;
}

export function AmsResultCard({
  severity,
  headline,
  reasons,
  actions,
  onTriggerSos,
}: AmsResultCardProps) {
  const isDanger = severity === "danger";

  return (
    <div className="space-y-4">
      <SeverityBanner
        severity={severity === "ok" ? "info" : severity}
        headline={headline}
        reasons={reasons}
        disclaimer="Sathi provides general safety information and helps you share your location. It does not provide medical diagnosis or guarantee rescue. In an emergency, descend if you can do so safely, and contact local rescue services directly. If in doubt, go down."
        actions={
          isDanger ? (
            <Button variant="sos" size="lg" className="w-full mt-2" onClick={onTriggerSos}>
              Start SOS Rescue Immediately
            </Button>
          ) : undefined
        }
      />

      {actions.length > 0 && (
        <div className="bg-surface border border-border rounded-[var(--radius)] p-4 space-y-2">
          <h4 className="font-semibold text-sm text-text">Recommended Actions:</h4>
          <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
            {actions.map((act, idx) => (
              <li key={idx}>{act}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
