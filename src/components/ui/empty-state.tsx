import * as React from "react";
import { cn } from "cn";
import { Mountain } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <Mountain className="w-10 h-10 text-text-muted" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-[var(--radius)] border border-dashed border-border text-center bg-surface-2/40 gap-3",
        className
      )}
    >
      <div className="p-3 bg-surface rounded-full border border-border">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
