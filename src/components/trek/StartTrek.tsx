"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { RadioGroup } from "radix-ui";
import type { RouteSummary } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Panel } from "../ui/panel";

export interface StartTrekProps {
  routes: RouteSummary[];
  initialRouteId?: string;
  disabled?: boolean;
  /** Shown above the button and tied to it, e.g. "Starting a trek needs signal once." */
  disabledReason?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  onStart: (routeId: string) => void;
}

export function StartTrek({ routes, initialRouteId, disabled, disabledReason, contactName, contactPhone, onStart }: StartTrekProps) {
  const startable = routes.filter((r) => r.hasFullData);
  const [selected, setSelected] = React.useState(startable.find((r) => r.id === initialRouteId)?.id ?? startable[0]?.id ?? "");
  const reasonId = React.useId();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-h1">Start a trek</h1>
        <p className="text-text-muted">Turns on position logging, the altitude monitor and SOS tracking for this route.</p>
      </div>

      {startable.length > 1 && (
        <Panel title="Route">
          <RadioGroup.Root value={selected} onValueChange={setSelected} aria-label="Route" className="space-y-2">
            {startable.map((r) => (
              <RadioGroup.Item
                key={r.id}
                value={r.id}
                className={cn(
                  "flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--radius)] border px-3 py-2 text-left",
                  selected === r.id ? "border-accent bg-accent-bg" : "border-control-border bg-surface-2 hover:bg-surface-3"
                )}
              >
                <span>
                  <span className="block text-body font-medium">{r.name}</span>
                  <span className="block text-small text-text-muted">
                    {r.region} · {r.days[0]}–{r.days[1]} days · max {formatAltitude(r.maxAltitudeM)}
                  </span>
                </span>
                {selected === r.id && <Check className="size-5 shrink-0 text-accent" aria-hidden />}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </Panel>
      )}
      {startable.length === 1 && startable[0] && (
        <Panel title="Route">
          <p className="text-body font-medium">{startable[0].name}</p>
          <p className="text-small text-text-muted">
            {startable[0].region} · {startable[0].days[0]}–{startable[0].days[1]} days · max {formatAltitude(startable[0].maxAltitudeM)}
          </p>
        </Panel>
      )}

      <Panel title="Emergency contact">
        {contactPhone ? (
          <p className="flex items-center gap-2 text-body">
            <Check className="size-5 shrink-0 text-ok" aria-hidden />
            <span>
              {contactName ? `${contactName} ` : ""}
              <span className="font-mono tabular-nums">{contactPhone}</span>
            </span>
          </p>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-body text-caution">
              <TriangleAlert className="size-5 shrink-0" aria-hidden /> No emergency contact yet.
            </p>
            <p className="text-small text-text-muted">The SOS text message goes to this contact first, so add one before you set out.</p>
            <Button asChild variant="secondary">
              <Link href="/settings">Add one in Settings</Link>
            </Button>
          </div>
        )}
      </Panel>

      {disabledReason && (
        <p id={reasonId} className="text-small text-caution">
          {disabledReason}
        </p>
      )}
      <Button size="lg" className="w-full" disabled={disabled || !selected} aria-describedby={disabledReason ? reasonId : undefined} onClick={() => onStart(selected)}>
        Start trek <ArrowRight className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
