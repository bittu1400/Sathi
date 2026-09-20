"use client";

import * as React from "react";
import {
  ArrowRight,
  Bird,
  Landmark,
  Minus,
  Mountain,
  Plus,
  Route,
  RotateCcw,
  Search,
  Sparkles,
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
import type { PlanMode } from "@/lib/plan/types";

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

/**
 * The three shapes a trip can take. A visitor leaves it on "Suggest"; someone
 * who knows the place picks, and the planner obeys — "Point to point" is the
 * exact line from the one place to the other, with no loop back.
 */
const MODES: { id: PlanMode; label: string; icon: typeof Sparkles }[] = [
  { id: "auto", label: "Suggest", icon: Sparkles },
  { id: "tour", label: "Day out", icon: RotateCcw },
  { id: "direct", label: "Point to point", icon: ArrowRight },
];

export const MIN_DAYS = 1;
export const MAX_DAYS = 21;

export interface TripFormProps {
  destination: Destination;
  /** "Your location", or the name of the place picked by hand. */
  startLabel: string;
  /** Why there is no start yet; null once there is one. */
  startHint: string | null;
  /** False until there is a start to plan from. */
  hasStart: boolean;
  days: number;
  mode: PlanMode;
  interests: InterestId[];
  busy: boolean;
  error: string | null;
  onDaysChange: (days: number) => void;
  onModeChange: (mode: PlanMode) => void;
  onInterestsChange: (interests: InterestId[]) => void;
  onChangeDestination: () => void;
  onChangeStart: () => void;
  onSubmit: () => void;
}

export function TripForm({
  destination,
  startLabel,
  startHint,
  hasStart,
  days,
  mode,
  interests,
  busy,
  error,
  onDaysChange,
  onModeChange,
  onInterestsChange,
  onChangeDestination,
  onChangeStart,
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
          <button
            type="button"
            onClick={onChangeStart}
            className="flex min-h-12 w-full items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body text-text">{startLabel}</span>
              {startHint && <span className="block text-small text-text-muted">{startHint}</span>}
            </span>
            <Search className="size-5 shrink-0 text-text-muted" aria-hidden />
          </button>
        </div>

        <div>
          <p className="mb-2 text-small text-text-muted">Shape of the trip</p>
          <ChipGroup>
            {MODES.map((option) => {
              const Icon = option.icon;
              return (
                <Chip key={option.id} selected={mode === option.id} onClick={() => onModeChange(option.id)}>
                  <Icon className="size-4" aria-hidden />
                  {option.label}
                </Chip>
              );
            })}
          </ChipGroup>
          {mode === "direct" && (
            <p className="mt-1 text-small text-text-muted">Straight from where you start to where you end.</p>
          )}
          {mode === "tour" && (
            <p className="mt-1 text-small text-text-muted">A loop through places, back where it began.</p>
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
