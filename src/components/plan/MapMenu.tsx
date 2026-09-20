"use client";

import Link from "next/link";
import { Compass, Info, Menu, Mountain, Settings, Users } from "lucide-react";
import { DropdownMenu } from "radix-ui";

const item =
  "flex min-h-12 cursor-pointer items-center gap-2 rounded-[var(--radius)] px-3 text-body text-text outline-none data-[highlighted]:bg-surface-2";

/**
 * The rest of the app, from the map. "/" is full-screen and has no tab bar, so
 * this button used to lead to the about page and nowhere else: a trekker who
 * started here could not reach routes, trek mode or their settings at all.
 */
const links = [
  { href: "/routes", label: "Trekking routes", icon: Compass },
  { href: "/trek", label: "Trek mode", icon: Mountain },
  { href: "/community", label: "Community", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About Sathi", icon: Info },
];

export function MapMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Menu"
        className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-text shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Menu className="size-5" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-[var(--z-overlay)] min-w-56 rounded-[var(--radius-lg)] border border-line-strong bg-surface-3 p-1 shadow-[var(--shadow-overlay)]"
        >
          {links.map(({ href, label, icon: Icon }) => (
            <DropdownMenu.Item key={href} asChild className={item}>
              <Link href={href}>
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
