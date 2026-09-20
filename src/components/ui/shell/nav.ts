import { Compass, Mountain, Map, Users } from "lucide-react";

/**
 * The four tabs, in the tab bar and the desktop header. The map at "/" is the
 * app's front door since the pivot, so it leads. SOS is not a tab (HeaderSos +
 * the FAB cover it) and Settings lives in the account menu.
 */
export const navItems = [
  { label: "Map", href: "/", icon: Map },
  { label: "Routes", href: "/routes", icon: Compass },
  { label: "Trek", href: "/trek", icon: Mountain },
  { label: "Community", href: "/community", icon: Users },
] as const;
