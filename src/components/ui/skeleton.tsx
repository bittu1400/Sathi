import * as React from "react";
import { cn } from "cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-3 motion-reduce:animate-none motion-reduce:bg-surface-2",
        className
      )}
      {...props}
    />
  );
}
