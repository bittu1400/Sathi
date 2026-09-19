"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

export type Theme = "dark" | "sunlight";
const EVENT = "sathi:theme";

function read(): Theme {
  return document.documentElement.getAttribute("data-theme") === "sunlight" ? "sunlight" : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** Current theme, hydration-safe (server renders the dark default). */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "dark");
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();

  const toggleTheme = () => {
    const next = theme === "dark" ? "sunlight" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sathi-theme", next);
    } catch {
      // private mode: theme still applies for this visit
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to sunlight theme" : "Switch to dark theme"}
      className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text transition-colors hover:bg-surface-2 ${className}`}
    >
      {theme === "dark" ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-accent" />}
    </button>
  );
}
