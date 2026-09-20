"use client";

import { Siren } from "lucide-react";
import { useSos } from "@/components/sos/SosProvider";
import { latestSosStore } from "@/lib/session";
import { Button } from "../button";

/** SOS is reachable from every trekker page (Q3). */
export function HeaderSos() {
  const { open } = useSos();
  const latest = latestSosStore.useValue();
  const active = latest !== null && latest.status !== "resolved";
  return (
    <Button variant="sos" size="md" onClick={() => open()} aria-label={active ? "Open active SOS" : "Send emergency SOS"}>
      <Siren className="size-5" strokeWidth={1.75} aria-hidden />
      SOS
    </Button>
  );
}
