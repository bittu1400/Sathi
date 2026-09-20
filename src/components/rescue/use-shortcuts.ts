import * as React from "react";

export interface ShortcutHandlers {
  next: () => void;
  prev: () => void;
  open: () => void;
  acknowledge: () => void;
  resolve: () => void;
  copy: () => void;
  toggleView: () => void;
  help: () => void;
}

const keys: Record<string, keyof ShortcutHandlers> = {
  j: "next",
  k: "prev",
  Enter: "open",
  a: "acknowledge",
  r: "resolve",
  c: "copy",
  m: "toggleView",
  "?": "help",
};

/** Console shortcuts. Ignored while typing in a field or while a dialog is open. */
export function useShortcuts(handlers: ShortcutHandlers) {
  const ref = React.useRef(handlers);
  React.useEffect(() => {
    ref.current = handlers;
  });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
      const name = keys[e.key];
      if (!name) return;
      // Enter on a focused button or link keeps its own meaning.
      if (e.key === "Enter" && target?.closest("button, a, summary")) return;
      e.preventDefault();
      ref.current[name]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function useMinWidth(px: number): boolean {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(`(min-width: ${px}px)`);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(`(min-width: ${px}px)`).matches,
    () => true,
  );
}
