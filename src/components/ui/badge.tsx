import * as React from "react";
import { Status, type StatusProps, type StatusTone } from "./status";

export type BadgeVariant = "neutral" | "ok" | "info" | "caution" | "warning" | "danger" | "unverified";

export interface BadgeProps extends Omit<StatusProps, "tone" | "variant" | "unverified"> {
  variant?: BadgeVariant;
}

/** Legacy API: `Status` now. Removed in RD-12. */
export function Badge({ variant = "neutral", ...props }: BadgeProps) {
  if (variant === "unverified") return <Status unverified {...props} />;
  const tone: StatusTone = variant === "info" ? "accent" : variant;
  return <Status tone={tone} {...props} />;
}
