import * as React from "react";
import { cn } from "cn";

const shapes = { line: "h-4 w-full", readout: "h-14 w-40", panel: "h-40 w-full", row: "h-11 w-full" };

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: keyof typeof shapes;
}

/** Give it the size of the final content so nothing shifts. Shimmer stops under reduced motion (globals.css). */
export function Skeleton({ shape, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[var(--radius)] bg-surface-3 motion-reduce:animate-none",
        shape && shapes[shape],
        className
      )}
      {...props}
    />
  );
}
