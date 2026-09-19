import * as React from "react";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/lib/types";
import { DANGER_ACTIONS, DANGER_HEADLINE, RED_FLAG_LABELS } from "@/lib/ams-copy";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";

export interface RedFlagListProps {
  selectedFlags: RedFlag[];
  onChange: (flags: RedFlag[]) => void;
  /** Ticking any flag shows the danger banner at once, with this action. */
  onSendSos: () => void;
  className?: string;
}

export function RedFlagList({ selectedFlags, onChange, onSendSos, className }: RedFlagListProps) {
  const flags = (Object.keys(RED_FLAG_LABELS) as RedFlag[]).map((id) => ({ id, label: RED_FLAG_LABELS[id] }));
  const toggle = (id: RedFlag) => onChange(selectedFlags.includes(id) ? selectedFlags.filter((f) => f !== id) : [...selectedFlags, id]);

  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="text-body font-medium">Any of these right now?</legend>
      <p className="text-small text-text-muted">Tick everything that applies. Leave all unticked if none do.</p>

      {selectedFlags.length > 0 && (
        <Banner
          severity="danger"
          headline={DANGER_HEADLINE}
          reasons={DANGER_ACTIONS}
          actions={
            <Button variant="sos" size="lg" className="w-full" onClick={onSendSos}>
              Send SOS
            </Button>
          }
        />
      )}

      <div className="space-y-2">
        {flags.map((flag) => {
          const checked = selectedFlags.includes(flag.id);
          return (
            <label
              key={flag.id}
              className={cn(
                "flex min-h-12 cursor-pointer select-none items-start gap-3 rounded-[var(--radius)] border p-3",
                checked ? "border-danger bg-danger-bg text-text" : "border-control-border bg-surface-2 text-text hover:bg-surface-3"
              )}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(flag.id)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-danger" />
              <span className="text-body">{flag.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
