import * as React from "react";
import { cn } from "cn";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Flat surface with a hairline border. Never nest interactive elements in an interactive panel. */
export function Panel({ title, meta, actions, className, children, ...props }: PanelProps) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-line bg-surface p-4 md:p-5", className)} {...props}>
      {(title || meta || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-h2 text-text">{title}</h2>}
          <div className="ml-auto flex items-center gap-3">
            {meta && <span className="text-label text-text-muted">{meta}</span>}
            {actions}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-center justify-between gap-3 border-b border-line pb-3", className)} {...props} />;
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...props} />;
}
