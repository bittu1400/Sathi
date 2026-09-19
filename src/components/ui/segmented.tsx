"use client";

import * as React from "react";
import { cn } from "cn";
import { RadioGroup } from "radix-ui";

export interface SegmentOption<T extends number | string> {
  value: T;
  label: string;
  description?: string;
}

export interface SegmentedProps<T extends number | string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

export function Segmented<T extends number | string>({ options, value, onChange, className, ...rest }: SegmentedProps<T>) {
  return (
    <RadioGroup.Root
      value={String(value)}
      onValueChange={(v) => onChange(options.find((o) => String(o.value) === v)!.value)}
      orientation="horizontal"
      className={cn(
        "grid w-full grid-cols-2 gap-1 rounded-[var(--radius)] border border-control-border bg-surface-2 p-1 sm:grid-cols-4",
        className
      )}
      {...rest}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={String(option.value)}
          value={String(option.value)}
          className={cn(
            "flex min-h-14 cursor-pointer select-none flex-col items-center justify-center rounded-[var(--radius-sm)] p-2 text-center transition-colors duration-[var(--dur-fast)]",
            option.value === value
              ? "bg-accent font-semibold text-ink"
              : "text-text-muted hover:bg-surface-3 hover:text-text"
          )}
        >
          <span className="font-mono text-body font-semibold tabular-nums">{option.value}</span>
          <span className="text-small">{option.label}</span>
          {option.description && <span className="text-small">{option.description}</span>}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
