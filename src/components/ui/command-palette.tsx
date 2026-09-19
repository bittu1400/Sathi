"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/db/queries";
import { getRoutes } from "@/lib/data";
import { formatAltitude } from "@/lib/format";
import { sessionStore } from "@/lib/session";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Kbd } from "./kbd";
import { toast } from "./toast";

export const OPEN_PALETTE_EVENT = "sathi:open-palette";

interface Item {
  id: string;
  group: "Go to" | "Routes" | "Actions";
  label: string;
  hint?: string;
  run: () => void;
}

/** ⌘K / Ctrl+K, or "/" outside a text field. Plain substring match, no fuzzy library. */
export function CommandPalette() {
  const router = useRouter();
  const session = sessionStore.useValue();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [role, setRole] = React.useState<Role | null>(null);

  const show = (next: boolean) => {
    setOpen(next);
    setQuery("");
    setActive(0);
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = (e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable=true]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show(true);
      } else if (e.key === "/" && !inField && !document.querySelector("[role=dialog], [role=alertdialog]")) {
        e.preventDefault();
        show(true);
      }
    };
    const onOpen = () => show(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  // Rescue/Agency entries depend on the role; look it up when the palette opens (skipped offline).
  React.useEffect(() => {
    if (!open || role) return;
    const sb = createClient();
    sb.auth
      .getUser()
      .then(({ data }) => (data.user ? getProfile(sb, data.user.id) : null))
      .then((p) => p && setRole(p.role))
      .catch(() => {});
  }, [open, role]);

  const go = (href: string) => () => router.push(href);

  const items: Item[] = [
    { id: "routes", group: "Go to", label: "Routes", run: go("/routes") },
    { id: "trek", group: "Go to", label: "Trek", run: go("/trek") },
    { id: "plan", group: "Go to", label: "Plan", run: go("/plan") },
    { id: "sos", group: "Go to", label: "SOS", run: go("/sos") },
    { id: "settings", group: "Go to", label: "Settings", run: go("/settings") },
    ...(role === "coordinator" ? [{ id: "rescue", group: "Go to" as const, label: "Rescue console", run: go("/rescue") }] : []),
    ...(role === "agency_admin" ? [{ id: "agency", group: "Go to" as const, label: "Agency console", run: go("/agency") }] : []),
    ...getRoutes().map((r) => ({ id: `route-${r.id}`, group: "Routes" as const, label: r.name, hint: formatAltitude(r.maxAltitudeM), run: go(`/routes/${r.id}`) })),
    ...(session?.trek
      ? [
          { id: "checkin", group: "Actions" as const, label: "Evening check-in", hint: "Opens trek mode", run: go("/trek") },
          {
            id: "share",
            group: "Actions" as const,
            label: "Copy family share link",
            run: async () => {
              try {
                await navigator.clipboard.writeText(`${window.location.origin}/share/${session.trek!.shareToken}`);
                toast.success("Link copied");
              } catch {
                toast.error("Couldn't copy the link.");
              }
            },
          },
          { id: "pack", group: "Actions" as const, label: "Offline pack for this route", hint: "Opens the route page", run: go(`/routes/${session.trek.routeId}`) },
        ]
      : []),
  ];

  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(q));
  const choose = (item: Item | undefined) => {
    if (!item) return;
    show(false);
    item.run();
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={show}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--scrim)]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[15vh] z-[var(--z-overlay)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-surface-3 shadow-[var(--shadow-overlay)]"
        >
          <RadixDialog.Title className="sr-only">Command palette</RadixDialog.Title>
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-4 text-text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, shown.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  choose(shown[active]);
                }
              }}
              role="combobox"
              aria-expanded
              aria-controls="palette-list"
              aria-activedescendant={shown[active] ? `palette-${shown[active].id}` : undefined}
              placeholder="Go to a page, route or action"
              className="h-12 flex-1 bg-transparent text-body text-text placeholder:text-text-muted focus:outline-none"
            />
            <Kbd>Esc</Kbd>
          </div>
          <ul id="palette-list" role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-1">
            {shown.length === 0 ? (
              <li role="presentation" className="space-y-2 p-4 text-text-muted">
                <p>No matches for &ldquo;{query}&rdquo;</p>
                <button type="button" className="cursor-pointer text-accent hover:underline" onClick={() => choose({ id: "all", group: "Go to", label: "Routes", run: go("/routes") })}>
                  Browse all routes
                </button>
              </li>
            ) : (
              shown.map((item, i) => (
                <React.Fragment key={item.id}>
                  {(i === 0 || shown[i - 1]!.group !== item.group) && (
                    <li role="presentation" className="px-3 pb-1 pt-2 text-label text-text-muted">
                      {item.group}
                    </li>
                  )}
                  <li
                    id={`palette-${item.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[var(--radius)] px-3 text-body", i === active ? "bg-surface-2 text-text" : "text-text")}
                  >
                    <span>{item.label}</span>
                    {item.hint && <span className="font-mono text-small text-text-muted">{item.hint}</span>}
                  </li>
                </React.Fragment>
              ))
            )}
          </ul>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
