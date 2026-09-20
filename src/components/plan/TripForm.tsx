"use client";

import * as React from "react";
import {
  Bird,
  Landmark,
  Minus,
  Mountain,
  Plus,
  Route,
  Search,
  Sunrise,
  Trees,
  Waves,
  Droplets,
  Hotel,
  Houses,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { INTERESTS, type InterestId } from "@/lib/plan/interests";

import type { Destination } from "./DestinationSearch";

/** One icon per interest: the chips read as a row of places, not a wall of text. */
const INTEREST_ICON: Record<InterestId, typeof Mountain> = {
  mountains: Mountain,
  rivers: Waves,
  sunrise: Sunrise,
  lakes: Droplets,
  waterfalls: Droplets,
  forests: Trees,
  culture: Landmark,
  villages: Houses,
  teahouses: Hotel,
  wildlife: Bird,
};

export const MIN_DAYS = 1;
export const MAX_DAYS = 21;

export interface TripFormProps {
  destination: Destination;
  /** Null while the device has no fix: the form says so instead of guessing. */
  hasStart: boolean;
  days: number;
  interests: InterestId[];
  busy: boolean;
  error: string | null;
  onDaysChange: (days: number) => void;
  onInterestsChange: (interests: InterestId[]) => void;
  onChangeDestination: () => void;
  onSubmit: () => void;
}

export function TripForm({
  destination,
  hasStart,
  days,
  interests,
  busy,
  error,
  onDaysChange,
  onInterestsChange,
  onChangeDestination,
  onSubmit,
}: TripFormProps) {
  const toggle = (id: InterestId) =>
    onInterestsChange(interests.includes(id) ? interests.filter((i) => i !== id) : [...interests, id]);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div>
          <p className="text-small text-text-muted">To</p>
          <button
            type="button"
            onClick={onChangeDestination}
            className="flex min-h-12 w-full items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-h2 text-text">{destination.name}</span>
              <span className="block truncate text-small text-text-muted">{destination.detail}</span>
            </span>
            <Search className="size-5 shrink-0 text-text-muted" aria-hidden />
          </button>
        </div>

        <div>
          <p className="text-small text-text-muted">From</p>
          <p className="text-body text-text">{hasStart ? "Your location" : "Waiting for your location…"}</p>
          {!hasStart && (
            <p className="mt-1 text-small text-text-muted">
              Turn location on, or Sathi can&apos;t work out where you are starting from.
            </p>
          )}
        </div>

        <div>
          <p className="text-small text-text-muted" id="days-label">
            Days
          </p>
          <div className="mt-1 flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              aria-label="One day fewer"
              disabled={days <= MIN_DAYS}
              onClick={() => onDaysChange(Math.max(MIN_DAYS, days - 1))}
            >
              <Minus className="size-5" aria-hidden />
            </Button>
            <output aria-labelledby="days-label" className="min-w-16 text-center font-mono text-h2 tabular-nums text-text">
              {days}
            </output>
            <Button
              variant="secondary"
              size="icon"
              aria-label="One day more"
              disabled={days >= MAX_DAYS}
              onClick={() => onDaysChange(Math.min(MAX_DAYS, days + 1))}
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-small text-text-muted">What do you want to see?</p>
          <ChipGroup>
            {INTERESTS.map((interest) => {
              const Icon = INTEREST_ICON[interest.id];
              return (
                <Chip
                  key={interest.id}
                  selected={interests.includes(interest.id)}
                  onClick={() => toggle(interest.id)}
                >
                  <Icon className="size-4" aria-hidden />
                  {interest.label}
                </Chip>
              );
            })}
          </ChipGroup>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}

      <Button className="w-full" disabled={!hasStart} state={busy ? "busy" : "idle"} onClick={onSubmit}>
        <Route className="size-5" aria-hidden /> Find routes
      </Button>
    </div>
  );
}
