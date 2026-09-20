"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import type { SosCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SosCountdownProps {
  initialCategory?: SosCategory
  onCancel: () => void
  onComplete: (data: { category: SosCategory; note: string }) => void
}

const SECONDS = 5
const CATEGORIES: { id: SosCategory; label: string }[] = [
  { id: "altitude_illness", label: "Altitude illness" },
  { id: "injury", label: "Injury" },
  { id: "lost", label: "Lost" },
  { id: "weather", label: "Weather" },
  { id: "other", label: "Other" },
]
const CIRCUMFERENCE = 2 * Math.PI * 40

/** SPEC §9.1 step 2: the countdown never waits for input; picking a category or typing doesn't reset it. */
export function SosCountdown({ initialCategory = "altitude_illness", onCancel, onComplete }: SosCountdownProps) {
  const [seconds, setSeconds] = React.useState(SECONDS)
  const [category, setCategory] = React.useState<SosCategory>(initialCategory)
  const [note, setNote] = React.useState("")
  const latest = React.useRef({ category, note, onComplete })
  React.useEffect(() => {
    latest.current = { category, note, onComplete }
  }, [category, note, onComplete])
  const fired = React.useRef(false)

  React.useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (!fired.current) {
      fired.current = true
      latest.current.onComplete({ category: latest.current.category, note: latest.current.note })
    }
  }, [seconds])

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-between space-y-6 p-6 text-text">
      <div className="space-y-1 text-center">
        <p className="text-h1 uppercase text-sos">Emergency SOS</p>
        <p className="text-body text-text-muted" aria-live="assertive">
          Sending in {seconds} s
        </p>
      </div>

      <div className="relative flex h-36 w-36 items-center justify-center" aria-hidden="true">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" className="stroke-surface-3" strokeWidth="8" fill="transparent" />
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-sos transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
            strokeWidth="8"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * seconds) / SECONDS}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-readout-xl text-sos">{seconds}</span>
      </div>

      <fieldset className="w-full space-y-2">
        <legend className="mb-2 w-full text-center text-label text-text-muted">
          What happened?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              aria-pressed={category === cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "min-h-12 cursor-pointer rounded-[var(--radius)] border p-2.5 text-body font-medium transition-colors duration-[var(--dur-fast)]",
                category === cat.id
                  ? "border-sos bg-sos text-ink"
                  : "border-control-border bg-surface-2 text-text hover:bg-surface-3"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="w-full">
        <span className="sr-only">Optional note</span>
        <input
          type="text"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (e.g. fell, head wound)"
          className="h-12 w-full rounded-[var(--radius)] border border-control-border bg-surface-2 px-3 text-body text-text placeholder:text-text-muted"
        />
      </label>

      <Button type="button" variant="secondary" onClick={onCancel} data-autofocus className="h-[72px] w-full text-h2">
        Cancel
      </Button>
    </div>
  )
}
