"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import type { RouteSummary, Terrain } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Panel } from "../ui/panel";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Table, type Column } from "../ui/table";
import { runWithUndo } from "../ui/use-undo";
import { DataStatus, DifficultyStatus, RouteRow } from "./RouteCard";
import { RouteFilters, daysLabels, emptyFilters, type FilterState } from "./RouteFilters";

/** Filters live in the URL so back, reload and bookmarks keep them. */
function parse(params: URLSearchParams): FilterState {
  const difficulty = params.get("difficulty") as FilterState["difficulty"];
  const daysRange = params.get("days") as FilterState["daysRange"];
  const sortBy = params.get("sort") as FilterState["sortBy"];
  return {
    difficulty: difficulty ?? undefined,
    daysRange: daysRange ?? undefined,
    terrain: (params.get("terrain")?.split(",").filter(Boolean) ?? []) as Terrain[],
    sortBy: sortBy ?? "data",
  };
}

function serialize(f: FilterState): string {
  const p = new URLSearchParams();
  if (f.difficulty) p.set("difficulty", f.difficulty);
  if (f.daysRange) p.set("days", f.daysRange);
  if (f.terrain.length) p.set("terrain", f.terrain.join(","));
  if (f.sortBy !== "data") p.set("sort", f.sortBy);
  return p.toString();
}

const activeCount = (f: FilterState) => (f.difficulty ? 1 : 0) + (f.daysRange ? 1 : 0) + f.terrain.length;

function apply(routes: RouteSummary[], f: FilterState): RouteSummary[] {
  return routes
    .filter((r) => {
      if (f.difficulty && r.difficulty !== f.difficulty) return false;
      if (f.daysRange === "short" && r.days[0] > 7) return false;
      if (f.daysRange === "medium" && (r.days[1] < 8 || r.days[0] > 14)) return false;
      if (f.daysRange === "long" && r.days[1] < 15) return false;
      if (f.terrain.length > 0 && !f.terrain.some((t) => r.terrain.includes(t))) return false;
      return true;
    })
    .sort((a, b) => {
      if (f.sortBy === "shortest") return a.days[0] - b.days[0];
      if (f.sortBy === "highest") return b.maxAltitudeM - a.maxAltitudeM;
      return Number(b.hasFullData) - Number(a.hasFullData);
    });
}

const columns: Column<RouteSummary>[] = [
  {
    key: "name",
    header: "Route",
    cell: (r) => (
      <Link href={`/routes/${r.id}`} className="font-medium text-text hover:text-accent">
        {r.name}
      </Link>
    ),
  },
  { key: "region", header: "Region", cell: (r) => <span className="text-text-muted">{r.region}</span> },
  { key: "alt", header: "Max altitude", numeric: true, cell: (r) => formatAltitude(r.maxAltitudeM) },
  { key: "days", header: "Days", numeric: true, cell: (r) => `${r.days[0]}–${r.days[1]}` },
  { key: "difficulty", header: "Difficulty", cell: (r) => <DifficultyStatus difficulty={r.difficulty} /> },
  { key: "data", header: "Data", cell: (r) => <DataStatus full={r.hasFullData} /> },
];

export function RouteBrowserClient({ routes }: { routes: RouteSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const filters = React.useMemo(() => parse(new URLSearchParams(search.toString())), [search]);
  const shown = React.useMemo(() => apply(routes, filters), [routes, filters]);
  const n = activeCount(filters);

  const setFilters = (next: FilterState) => {
    const q = serialize(next);
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const clear = () => {
    const previous = filters;
    runWithUndo({ apply: () => setFilters(emptyFilters), revert: () => setFilters(previous), commit: () => undefined, message: "Filters cleared" });
  };

  const described = [
    filters.difficulty,
    filters.daysRange && daysLabels[filters.daysRange].toLowerCase(),
    ...filters.terrain.map((t) => t.replace("_", " ")),
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <Panel title="Filters" actions={n > 0 && <Button size="sm" variant="ghost" onClick={clear}>Clear filters</Button>}>
          <RouteFilters filters={filters} onChange={setFilters} />
        </Panel>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p role="status" className="text-small text-text-muted">
          {shown.length} of {routes.length} routes
        </p>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">
                <SlidersHorizontal className="size-4" aria-hidden /> Filters{n > 0 ? ` (${n})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent title="Filters">
              <RouteFilters filters={filters} onChange={setFilters} />
              {n > 0 && (
                <Button variant="ghost" className="mt-4 w-full" onClick={clear}>
                  Clear filters
                </Button>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title="No routes match"
          description={`Nothing matches ${described.join(" + ")}. Remove a filter to see more.`}
          action={<Button variant="secondary" onClick={clear}>Clear filters</Button>}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table caption="Trekking routes" columns={columns} rows={shown} rowKey={(r) => r.id} />
          </div>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface md:hidden">
            {shown.map((r) => (
              <RouteRow key={r.id} route={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
