import * as React from "react";
import { cn } from "cn";

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
}

export function Segmented<T extends number | string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-2 bg-surface-2 p-1.5 rounded-[var(--radius)] border border-border w-full",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-[var(--radius-sm)] transition-all cursor-pointer min-h-[56px] text-center select-none",
              isSelected
                ? "bg-accent text-accent-ink font-semibold shadow-sm"
                : "text-text-muted hover:bg-surface-3 hover:text-text"
            )}
          >
            <span className="text-base font-mono font-bold leading-none mb-1">
              {option.value}
            </span>
            <span className="text-xs leading-tight line-clamp-1">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
