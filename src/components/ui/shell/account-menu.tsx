"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUser, LogOut } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/db/queries";
import { sessionStore } from "@/lib/session";
import type { Role } from "@/lib/types";
import { toast } from "../toast";

const item =
  "flex min-h-12 cursor-pointer items-center gap-2 rounded-[var(--radius)] px-3 text-body text-text outline-none data-[highlighted]:bg-surface-2";

/** Name and role, Settings, Rescue/Agency for those roles, sign out. "Sign in" when signed out. */
export function AccountMenu() {
  const router = useRouter();
  const cached = sessionStore.useValue();
  const [state, setState] = React.useState<{ signedIn: boolean; name: string; role: Role | null } | null>(null);

  React.useEffect(() => {
    const sb = createClient();
    let live = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) return live && setState({ signedIn: false, name: "", role: null });
        const profile = await getProfile(sb, user.id);
        if (live) setState({ signedIn: true, name: profile?.displayName ?? "Trekker", role: profile?.role ?? null });
      } catch {
        // offline: fall back to the cached session below
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const signedIn = state ? state.signedIn : cached !== null;
  const name = state?.name || cached?.displayName || "Account";
  const role = state?.role ?? null;

  if (!signedIn)
    return (
      <Link href="/login" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-[var(--radius)] px-3 text-body font-medium text-accent hover:bg-surface-2">
        Sign in
      </Link>
    );

  const signOut = async () => {
    const { error } = await createClient().auth.signOut();
    if (error) return toast.error("Couldn't sign out. Try again.");
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Account menu"
        className="flex size-12 cursor-pointer items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-2 hover:text-text"
      >
        <CircleUser className="size-6" strokeWidth={1.75} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[var(--z-overlay)] min-w-56 rounded-[var(--radius-lg)] border border-line-strong bg-surface-3 p-1 shadow-[var(--shadow-overlay)]"
        >
          <div className="px-3 py-2">
            <p className="text-body font-medium text-text">{name}</p>
            {role && <p className="text-small capitalize text-text-muted">{role.replace("_", " ")}</p>}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className={item}>
            <Link href="/settings">Settings</Link>
          </DropdownMenu.Item>
          {role === "coordinator" && (
            <DropdownMenu.Item asChild className={item}>
              <Link href="/rescue">Rescue console</Link>
            </DropdownMenu.Item>
          )}
          {role === "agency_admin" && (
            <DropdownMenu.Item asChild className={item}>
              <Link href="/agency">Agency console</Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className={item} onSelect={signOut}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
