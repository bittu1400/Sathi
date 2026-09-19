"use client";

import * as React from "react";
import { EllipsisVertical, Flag } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Status } from "../ui/status";

export interface TrekHeaderProps {
  routeName: string;
  dayNumber: number;
  /** Omit to hide the menu. */
  onEnd?: () => void;
  endDisabled?: boolean;
  endHint?: string;
}

export function TrekHeader({ routeName, dayNumber, onEnd, endDisabled, endHint }: TrekHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h1 className="text-h1">{routeName}</h1>
        <div className="flex items-center gap-2">
          <Status tone="ok">Active</Status>
          <span className="font-mono text-small tabular-nums text-text-muted">Day {dayNumber}</span>
        </div>
      </div>
      {onEnd && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger aria-label="Trek options" className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-2 hover:text-text">
            <EllipsisVertical className="size-5" strokeWidth={1.75} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-[var(--z-overlay)] min-w-56 rounded-[var(--radius-lg)] border border-line-strong bg-surface-3 p-1 shadow-[var(--shadow-overlay)]">
              <DropdownMenu.Item
                disabled={endDisabled}
                onSelect={onEnd}
                className="flex min-h-12 cursor-pointer items-center gap-2 rounded-[var(--radius)] px-3 text-body text-text outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-surface-2"
              >
                <Flag className="size-4" aria-hidden /> End trek
              </DropdownMenu.Item>
              {endHint && <p className="px-3 pb-2 text-small text-text-muted">{endHint}</p>}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
