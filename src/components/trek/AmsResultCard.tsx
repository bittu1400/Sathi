import * as React from "react";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { Panel } from "../ui/panel";
import { STANDARD_DISCLAIMER } from "@/lib/ams-copy";
import type { AmsResult } from "@/lib/types";

export interface AmsResultCardProps {
  result: AmsResult;
  onTriggerSos: () => void;
}

/** Shows exactly what evaluateAms() returned; no wording of its own. */
export function AmsResultCard({ result, onTriggerSos }: AmsResultCardProps) {
  return (
    <div className="space-y-4">
      <Banner
        severity={result.level}
        headline={result.headline}
        reasons={result.reasons}
        disclaimer={STANDARD_DISCLAIMER}
        actions={
          result.level === "danger" ? (
            <Button variant="sos" size="lg" className="w-full" onClick={onTriggerSos}>
              Send SOS
            </Button>
          ) : undefined
        }
      />
      {result.actions.length > 0 && (
        <Panel title="What to do now">
          <ul className="list-inside list-disc space-y-1 text-body text-text-muted">
            {result.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
