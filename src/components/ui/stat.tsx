import * as React from "react";
import { Readout, type ReadoutProps } from "./readout";

export interface StatProps extends Omit<ReadoutProps, "size"> {
  size?: "md" | "lg";
}

/** Legacy API: `Readout` now. Removed in RD-12. */
export function Stat({ size = "md", ...props }: StatProps) {
  return <Readout size={size === "lg" ? "xl" : "md"} {...props} />;
}
