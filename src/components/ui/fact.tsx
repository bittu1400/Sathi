import * as React from "react";
import { cn } from "@/lib/utils";

export function FactList({ className, ...props }: React.HTMLAttributes<HTMLDListElement>) {
  return <dl className={cn("divide-y divide-line", className)} {...props} />;
}

/** One label/value row for text facts (start point, permits). Numbers use `Readout`. */
export function Fact({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", className)}>
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="text-right text-body text-text">{children}</dd>
    </div>
  );
}
