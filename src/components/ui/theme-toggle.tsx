"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sathi-theme";
const CHANGED = "sathi:theme";
type Theme = "light" | "dark";

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Private mode: no stored choice, so the phone keeps deciding.
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(CHANGED));
}

/**
 * The theme is on the html element, set before paint by the inline script in
 * layout.tsx. This reads it from there rather than keeping a second copy, so
 * two toggles on one page can never disagree and nothing flashes on the way in.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  // Until the trekker taps once, the phone decides — including a change made
  // while the app is open, which is what an automatic schedule does.
  const follow = (event: MediaQueryListEvent) => {
    if (stored()) return;
    apply(event.matches ? "light" : "dark");
  };
  media.addEventListener("change", follow);
  window.addEventListener(CHANGED, onChange);
  return () => {
    media.removeEventListener("change", follow);
    window.removeEventListener(CHANGED, onChange);
  };
}

const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** Light or dark, the trekker's call; the phone's until they make one. */
export function ThemeToggle({ className }: { className?: string }) {
  // Dark on the server: the markup is themeless, and the script has already
  // put the real theme on the element by the time this hydrates.
  const theme = React.useSyncExternalStore(subscribe, read, () => "dark" as Theme);

  const flip = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage off: the choice holds for this visit and no longer.
    }
  };

  const label = theme === "light" ? "Switch to dark" : "Switch to light";
  const Icon = theme === "light" ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-12 cursor-pointer items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
