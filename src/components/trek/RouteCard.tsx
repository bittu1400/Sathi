import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { RouteSummary } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Chip, ChipGroup } from "../ui/chip";
import { Calendar, Mountain } from "lucide-react";

export function RouteCard({ route }: { route: RouteSummary }) {
  return (
    <Link href={`/routes/${route.id}`} className="group block">
      <div className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-sm hover:border-accent/60 transition-all group-hover:shadow-md">
        {/* Image Header */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={route.heroImage}
            alt={route.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={route.difficulty === "easy" ? "ok" : "warning"}>
              {route.difficulty.toUpperCase()}
            </Badge>
            {route.hasFullData && <Badge variant="ok">Offline Pack</Badge>}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <span className="text-xs uppercase tracking-wider text-accent font-semibold">
              {route.region}
            </span>
            <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
              {route.name}
            </h3>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-text-muted line-clamp-2">
            {route.summary}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-text">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span>{route.days[0]}–{route.days[1]} days</span>
            </div>

            <div className="flex items-center gap-1.5 text-text font-bold">
              <Mountain className="w-3.5 h-3.5 text-accent" />
              <span>{route.maxAltitudeM.toLocaleString()} m</span>
            </div>
          </div>

          <ChipGroup className="pt-1">
            {route.terrain.slice(0, 3).map((t) => (
              <Chip key={t} className="py-0.5 px-2 text-[10px] min-h-0 pointer-events-none">
                {t.replace("_", " ")}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      </div>
    </Link>
  );
}
