"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Toast as RadixToast } from "radix-ui";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
  action?: { label: string; onClick: () => void };
}

const NONE: ToastItem[] = [];
let items: ToastItem[] = NONE;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(kind: Kind, message: string, options?: { action?: ToastItem["action"] }) {
  // At most 3 stacked.
  items = [...items, { id: nextId++, kind, message, action: options?.action }].slice(-3);
  emit();
}

function remove(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

/** Quiet confirmations only. Never for safety-critical state (AMS verdicts, SOS): use a Banner. */
export const toast = {
  success: (message: string, options?: { action?: ToastItem["action"] }) => push("success", message, options),
  error: (message: string, options?: { action?: ToastItem["action"] }) => push("error", message, options),
  info: (message: string, options?: { action?: ToastItem["action"] }) => push("info", message, options),
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const icons = { success: CheckCircle2, error: TriangleAlert, info: Info };
const tones = { success: "text-ok", error: "text-danger", info: "text-accent" };

export function Toaster() {
  const list = React.useSyncExternalStore(subscribe, () => items, () => NONE);
  return (
    <RadixToast.Provider swipeDirection="down">
      {list.map((t) => {
        const Icon = icons[t.kind];
        return (
          <RadixToast.Root
            key={t.id}
            type={t.kind === "error" ? "foreground" : "background"}
            duration={t.action ? 8000 : 4000}
            onOpenChange={(open) => !open && remove(t.id)}
            className="flex items-center gap-3 rounded-[var(--radius)] border border-line-strong bg-surface-3 p-3 shadow-[var(--shadow-overlay)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-[var(--dur)]"
          >
            <Icon className={cn("size-5 shrink-0", tones[t.kind])} strokeWidth={1.75} aria-hidden />
            <RadixToast.Description className="flex-1 text-body text-text">{t.message}</RadixToast.Description>
            {t.action && (
              <RadixToast.Action altText={t.action.label} onClick={t.action.onClick} className="min-h-12 cursor-pointer px-3 text-body font-medium text-accent hover:underline">
                {t.action.label}
              </RadixToast.Action>
            )}
          </RadixToast.Root>
        );
      })}
      <RadixToast.Viewport
        label="Notifications"
        className="fixed inset-x-4 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1rem)] z-[var(--z-toast)] flex flex-col gap-2 outline-none md:inset-x-auto md:bottom-4 md:right-4 md:w-96"
      />
    </RadixToast.Provider>
  );
}
