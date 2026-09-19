import { Compass, Mountain, Map, Settings } from "lucide-react";

/** The four tabs, in the tab bar and the desktop header. SOS is not a tab: HeaderSos + the FAB cover it. */
export const navItems = [
  { label: "Routes", href: "/routes", icon: Compass },
  { label: "Trek", href: "/trek", icon: Mountain },
  { label: "Plan", href: "/plan", icon: Map },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;
