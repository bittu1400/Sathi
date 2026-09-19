import * as React from "react";
import { cn } from "@/lib/utils";

export function TopoBackground({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none opacity-5 text-text stroke-current fill-none overflow-hidden",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 600"
      preserveAspectRatio="none"
    >
      <path
        d="M -100 100 Q 200 40, 500 120 T 900 80"
        strokeWidth="2"
      />
      <path
        d="M -100 180 Q 150 120, 480 200 T 900 160"
        strokeWidth="1.5"
      />
      <path
        d="M -100 260 Q 250 200, 520 300 T 900 240"
        strokeWidth="2"
      />
      <path
        d="M -100 340 Q 180 280, 450 360 T 900 320"
        strokeWidth="1.5"
      />
      <path
        d="M -100 420 Q 220 360, 500 440 T 900 400"
        strokeWidth="2"
      />
      <path
        d="M -100 500 Q 140 440, 460 520 T 900 480"
        strokeWidth="1.5"
      />
      {/* Mountain Contour Ellipses */}
      <ellipse cx="400" cy="300" rx="250" ry="140" strokeWidth="1.5" />
      <ellipse cx="400" cy="300" rx="180" ry="90" strokeWidth="2" />
      <ellipse cx="400" cy="300" rx="110" ry="50" strokeWidth="1.5" />
      <ellipse cx="400" cy="300" rx="40" ry="20" strokeWidth="2" />
    </svg>
  );
}
