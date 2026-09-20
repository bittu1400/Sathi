"use client";

import * as React from "react";
import { MapPin, Mountain, Search } from "lucide-react";

export interface Destination {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  /** Set when the destination is one of our curated treks. */
  routeId?: string;
}

export interface DestinationSearchProps {
  destinations: Destination[];
  onPick: (destination: Destination) => void;
}

/**
 * Searches the curated treks, offline, with no key. Place search over the whole
 * country is merged into this list once the routing key exists.
 */
export function DestinationSearch({ destinations, onPick }: DestinationSearchProps) {
  const [query, setQuery] = React.useState("");
  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) => `${d.name} ${d.detail}`.toLowerCase().includes(q));
  }, [destinations, query]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted" aria-hidden />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a trek or a place"
          aria-label="Destination"
          className="h-12 w-full rounded-[var(--radius)] border border-control-border bg-surface-2 pr-3 pl-10 text-body text-text placeholder:text-text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>

      {results.length === 0 ? (
        <p className="px-1 py-6 text-center text-small text-text-muted">
          Nothing matches “{query.trim()}”. Try a trek name, a region, or a start point.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
          {results.map((destination) => (
            <li key={destination.id}>
              <button
                type="button"
                onClick={() => onPick(destination)}
                className="flex min-h-12 w-full items-center gap-3 px-1 py-3 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {destination.routeId ? (
                  <Mountain className="size-5 shrink-0 text-accent" aria-hidden />
                ) : (
                  <MapPin className="size-5 shrink-0 text-text-muted" aria-hidden />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-body text-text">{destination.name}</span>
                  <span className="block truncate text-small text-text-muted">{destination.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
