import * as React from "react";
import { RedFlag } from "@/lib/types";
import { AlertOctagon } from "lucide-react";
import { cn } from "cn";

export interface RedFlagListProps {
  selectedFlags: RedFlag[];
  onChange: (flags: RedFlag[]) => void;
  className?: string;
}

export function RedFlagList({ selectedFlags, onChange, className }: RedFlagListProps) {
  const redFlags: { id: RedFlag; label: string }[] = [
    { id: "confusion", label: "Confused, very drowsy, or acting strangely" },
    { id: "ataxia", label: "Can't walk in a straight line heel-to-toe / stumbling" },
    { id: "breathless_at_rest", label: "Out of breath while resting" },
    { id: "wet_cough", label: "Wet or gurgling cough, or pink/frothy spit" },
    { id: "severe_headache_unrelieved", label: "Severe headache that painkillers don't help" },
  ];

  const toggleFlag = (flagId: RedFlag) => {
    if (selectedFlags.includes(flagId)) {
      onChange(selectedFlags.filter((f) => f !== flagId));
    } else {
      onChange([...selectedFlags, flagId]);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-danger">
        <AlertOctagon className="w-4 h-4 text-danger" />
        HACE / HAPE Red Flags Check (Immediate Action Required)
      </div>

      <div className="space-y-2">
        {redFlags.map((flag) => {
          const isChecked = selectedFlags.includes(flag.id);
          return (
            <label
              key={flag.id}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-[var(--radius-sm)] border cursor-pointer transition-all select-none",
                isChecked
                  ? "bg-danger/20 border-danger text-text font-medium"
                  : "bg-surface-2 border-border text-text-muted hover:bg-surface-3 hover:text-text"
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleFlag(flag.id)}
                className="mt-0.5 accent-danger w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm leading-tight">{flag.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
