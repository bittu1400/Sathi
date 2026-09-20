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

/** Two letters: enough to mean something, short enough to feel instant. */
const TYPED_ENOUGH = 2;

export interface DestinationSearchProps {
  destinations: Destination[];
  onPick: (destination: Destination) => void;
}

/**
 * The curated treks are matched offline, with no key; anywhere else in Nepal
 * comes from /api/places, which holds the routing key server-side. Curated
 * matches stay on top: we know their days and their start point.
 */
export function DestinationSearch({ destinations, onPick }: DestinationSearchProps) {
  const [query, setQuery] = React.useState("");
  const [places, setPlaces] = React.useState<Destination[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const curated = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) => `${d.name} ${d.detail}`.toLowerCase().includes(q));
  }, [destinations, query]);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < TYPED_ENOUGH) return;
    let live = true;
    const controller = new AbortController();
    // One request per pause in the typing: the free tier is 1,000 a day.
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { places?: Destination[]; error?: string }
          | null;
        if (!live) return;
        if (!response.ok || !Array.isArray(body?.places)) {
          setPlaces([]);
          setSearchError(body?.error ?? "Place search is unavailable.");
          return;
        }
        setPlaces(body.places.map((place) => ({ ...place, id: `place:${place.id}` })));
        setSearchError(null);
      } catch {
        if (!live) return;
        setPlaces([]);
        setSearchError(
          typeof navigator !== "undefined" && !navigator.onLine
            ? "Place search needs a connection. Saved treks still work."
            : "Place search is unavailable.",
        );
      } finally {
        if (live) setSearching(false);
      }
    }, 300);

    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Below that, the only answer is the curated list, and anything the last
  // search left behind is stale rather than wrong.
  const searched = query.trim().length >= TYPED_ENOUGH;

  const results = React.useMemo(() => {
    if (!searched) return curated;
    const names = new Set(curated.map((d) => d.name.toLowerCase()));
    return [...curated, ...places.filter((place) => !names.has(place.name.toLowerCase()))];
  }, [curated, places, searched]);

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

      {searched && searchError && (
        <p role="alert" className="px-1 text-small text-text-muted">
          {searchError}
        </p>
      )}

      {results.length === 0 ? (
        <p className="px-1 py-6 text-center text-small text-text-muted">
          {searched && searching
            ? "Searching…"
            : `Nothing matches “${query.trim()}”. Try a trek name, a region, or a start point.`}
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
