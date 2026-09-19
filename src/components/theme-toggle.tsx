"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "sunlight">(() => {
    if (typeof window !== "undefined") {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "sunlight" || current === "dark") return current;
    }
    return "dark";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "sunlight" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sathi-theme", next);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`p-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text transition-colors flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-warning" />
      ) : (
        <Moon className="w-5 h-5 text-accent" />
      )}
    </button>
  );
}
