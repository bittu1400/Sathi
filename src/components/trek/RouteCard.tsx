import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Difficulty, RouteSummary } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { Status, type StatusTone } from "../ui/status";

export const difficultyTone: Record<Difficulty, StatusTone> = { easy: "ok", moderate: "accent", strenuous: "warning", extreme: "danger" };

export function DifficultyStatus({ difficulty }: { difficulty: Difficulty }) {
  return <Status tone={difficultyTone[difficulty]}>{difficulty}</Status>;
}

export function DataStatus({ full }: { full: boolean }) {
  return full ? <Status tone="ok">Full data</Status> : <Status unverified>Preview</Status>;
}

/** One route as a dense row (mobile list). The whole row is the link. */
export function RouteRow({ route }: { route: RouteSummary }) {
  return (
    <Link
      href={`/routes/${route.id}`}
      className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-body font-medium">{route.name}</span>
          <span className="shrink-0 font-mono text-body tabular-nums">{formatAltitude(route.maxAltitudeM)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-small text-text-muted">
          <span>{route.region}</span>
          <span aria-hidden>·</span>
          <span className="font-mono tabular-nums">
            {route.days[0]}–{route.days[1]} days
          </span>
          <DifficultyStatus difficulty={route.difficulty} />
          <DataStatus full={route.hasFullData} />
        </div>
        {!route.hasFullData && <p className="text-small text-text-muted">Preview — stages and packs not ready</p>}
      </div>
      <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
    </Link>
  );
}
