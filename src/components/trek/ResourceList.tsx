import * as React from "react";
import { Resource } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Phone, Shield, Cross, Landmark, Navigation } from "lucide-react";
import { cn } from "cn";

export interface ResourceListProps {
  resources: Resource[];
  className?: string;
}

export function ResourceList({ resources, className }: ResourceListProps) {
  if (!resources || resources.length === 0) {
    return (
      <div className="p-4 text-center text-text-muted text-sm border border-border rounded-[var(--radius)] bg-surface">
        No emergency medical or rescue resources listed for this route segment.
      </div>
    );
  }

  const getKindIcon = (kind: Resource["kind"]) => {
    switch (kind) {
      case "hra_post":
      case "hospital":
      case "health_post":
        return <Cross className="w-4 h-4 text-ok" />;
      case "heli_operator":
      case "helipad":
        return <Navigation className="w-4 h-4 text-info" />;
      case "police":
        return <Shield className="w-4 h-4 text-warning" />;
      default:
        return <Landmark className="w-4 h-4 text-text-muted" />;
    }
  };

  const formatKindLabel = (kind: Resource["kind"]) => {
    switch (kind) {
      case "hra_post":
        return "HRA Medical Aid Post";
      case "hospital":
        return "Hospital / Clinic";
      case "health_post":
        return "Local Health Post";
      case "heli_operator":
        return "Helicopter Operator";
      case "helipad":
        return "Helipad";
      case "police":
        return "Tourist Police Post";
      default:
        return "Emergency Resource";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {resources.map((res) => (
        <div
          key={res.id}
          className="p-4 rounded-[var(--radius)] border border-border bg-surface hover:bg-surface-2/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {getKindIcon(res.kind)}
              <h4 className="font-semibold text-base text-text">{res.name}</h4>
              <Badge variant="neutral">{formatKindLabel(res.kind)}</Badge>
              {res.verified === null && <Badge variant="unverified">Unverified</Badge>}
            </div>
            {res.notes && (
              <p className="text-sm text-text-muted">{res.notes}</p>
            )}
            {res.seasonal && (
              <p className="text-xs text-caution font-medium">{res.seasonal}</p>
            )}
          </div>

          {res.phone && (
            <a
              href={`tel:${res.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 text-accent border border-accent/40 font-mono text-sm font-semibold hover:bg-accent/25 transition-colors self-start sm:self-center"
            >
              <Phone className="w-4 h-4" />
              {res.phone}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
