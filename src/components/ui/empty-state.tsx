import * as React from "react";
import { cn } from "@/lib/utils";
import { Mountain, TriangleAlert } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <Mountain className="size-6 text-text-muted" strokeWidth={1.75} />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface p-8 text-center",
        className
      )}
    >
      {icon}
      <h3 className="text-h2 text-text">{title}</h3>
      {description && <p className="max-w-sm text-body text-text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Says what happened and what to do; Retry when the caller can retry. */
export function ErrorState({ onRetry, ...props }: EmptyStateProps & { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlert className="size-6 text-danger" strokeWidth={1.75} />}
      action={
        props.action ??
        (onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ))
      }
      {...props}
    />
  );
}
