"use client";

import * as React from "react";
import { Copy, Phone } from "lucide-react";
import type { Resource, ResourceKind } from "@/lib/types";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Status } from "../ui/status";
import { toast } from "../ui/toast";

const kindLabel: Record<ResourceKind, string> = {
  hra_post: "HRA aid post",
  hospital: "Hospital or clinic",
  health_post: "Health post",
  heli_operator: "Helicopter operator",
  helipad: "Helipad",
  police: "Tourist police",
  embassy: "Embassy",
  rescue_org: "Rescue organisation",
};

/** Only splits the country code; per-city grouping isn't verified. */
const formatPhone = (p: string) => p.replace(/^\+977/, "+977 ");

function Row({ res }: { res: Resource }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(res.phone!);
      toast.success("Number copied");
    } catch {
      toast.error("Couldn't copy. Select the number instead.");
    }
  };
  return (
    <li className="space-y-2 border-b border-line p-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-body font-medium">{res.name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Status>{kindLabel[res.kind] ?? "Emergency resource"}</Status>
            {res.verified === null && <Status unverified>Not yet verified</Status>}
          </div>
        </div>
        {res.phone ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <a href={`tel:${res.phone}`} aria-label={`Call ${res.name}`}>
                <Phone className="size-4" aria-hidden />
                <span className="font-mono tabular-nums">{formatPhone(res.phone)}</span>
              </a>
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Copy number for ${res.name}`} onClick={copy}>
              <Copy className="size-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <p className="text-small text-text-muted">No number listed</p>
        )}
      </div>
      {res.notes && <p className="text-small text-text-muted">{res.notes}</p>}
      {res.seasonal && <p className="text-small text-caution">{res.seasonal}</p>}
      {res.verified && (
        <details className="text-small text-text-muted">
          <summary className="cursor-pointer">Source</summary>
          <p className="pt-1">
            {res.verified.source} · <span className="font-mono">{res.verified.date}</span>
          </p>
        </details>
      )}
    </li>
  );
}

function Group({ title, items }: { title: string; items: Resource[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-label text-text-muted">{title}</h3>
      <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
        {items.map((r) => (
          <Row key={r.id} res={r} />
        ))}
      </ul>
    </div>
  );
}

export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0)
    return <EmptyState title="No emergency resources listed" description="None are on file for this route yet." />;
  return (
    <div className="space-y-4">
      <Group title="Verified" items={resources.filter((r) => r.verified !== null)} />
      <Group title="Not yet verified" items={resources.filter((r) => r.verified === null)} />
    </div>
  );
}
