import React from "react";

interface TopoBackgroundProps {
  className?: string;
}

/**
 * Handcrafted SVG contour elevation background pattern.
 * Subtle, lightweight, and responsive.
 */
export function TopoBackground({ className = "" }: TopoBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full opacity-[0.06] stroke-current"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-50,300 Q150,200 400,350 T850,250"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M-50,350 Q180,240 400,400 T850,320"
          strokeWidth="1.5"
        />
        <path
          d="M-50,420 Q200,290 400,460 T850,390"
          strokeWidth="2"
        />
        <path
          d="M-50,500 Q220,350 400,520 T850,460"
          strokeWidth="1.5"
        />
        <path
          d="M100,50 Q300,-40 500,80 T900,20"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M50,120 Q320,30 500,140 T900,80"
          strokeWidth="1.5"
        />
        <path
          d="M0,190 Q340,90 500,210 T900,150"
          strokeWidth="2"
        />
        <circle cx="400" cy="460" r="14" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="400" cy="460" r="32" strokeWidth="1" />
        <circle cx="400" cy="460" r="54" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
