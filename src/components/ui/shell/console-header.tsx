"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "../button";
import { Logo } from "../logo";
import { Status } from "../status";
import { ThemeToggle } from "../theme-toggle";
import { toast } from "../toast";

export interface ConsoleHeaderProps {
  /** e.g. "Coordination" or "Agency". */
  product: string;
  name: string;
  role: string;
  /** Live-connection state of the console's data feed. */
  live: boolean;
  /** Extra controls, placed before the sign-out button. */
  children?: React.ReactNode;
}

/** Identity, role, live status and sign out for /rescue and /agency. */
export function ConsoleHeader({ product, name, role, live, children }: ConsoleHeaderProps) {
  const router = useRouter();
  const signOut = async () => {
    const { error } = await createClient().auth.signOut();
    if (error) return toast.error("Couldn't sign out. Try again.");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-bg px-4 py-2">
      <Logo />
      <span className="text-label text-text-muted">{product}</span>
      <Status tone={live ? "ok" : "warning"}>{live ? "Live" : "Reconnecting"}</Status>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ThemeToggle className="size-10" />
        <span className="hidden text-small text-text-muted sm:inline">
          {name} · {role}
        </span>
        {children}
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="size-4" aria-hidden /> Sign out
        </Button>
      </div>
    </header>
  );
}
