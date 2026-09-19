"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import type { SosCategory } from "@/lib/types"

interface SosCountdownProps {
  initialCategory?: SosCategory
  onCancel: () => void
  onComplete: (data: { category: SosCategory; note: string }) => void
}

const CATEGORIES: { id: SosCategory; label: string }[] = [
  { id: "altitude_illness", label: "Altitude Illness" },
  { id: "injury", label: "Injury / Trauma" },
  { id: "lost", label: "Lost / Off Trail" },
  { id: "weather", label: "Severe Weather" },
  { id: "other", label: "Other Emergency" },
]

export function SosCountdown({
  initialCategory = "altitude_illness",
  onCancel,
  onComplete,
}: SosCountdownProps) {
  const [seconds, setSeconds] = React.useState(5)
  const [category, setCategory] = React.useState<SosCategory>(initialCategory)
  const [note, setNote] = React.useState("")

  React.useEffect(() => {
    if (seconds <= 0) {
      onComplete({ category, note })
      return
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [seconds, category, note, onComplete])

  // Circumference for r=40 is 2 * PI * 40 = 251.3
  const strokeDashoffset = 251.3 - (251.3 * seconds) / 5

  return (
    <div className="flex flex-col items-center justify-between h-full p-6 text-foreground max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-red-600 uppercase">
          Emergency SOS
        </h2>
        <p className="text-xs text-muted-foreground">
          Dispatching emergency beacon in {seconds}s...
        </p>
      </div>

      {/* Countdown Ring */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-muted"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-red-600 transition-all duration-1000 ease-linear"
            strokeWidth="8"
            strokeDasharray="251.3"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-5xl font-mono font-black text-red-600">
          {seconds}
        </span>
      </div>

      {/* Category selector */}
      <div className="w-full space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
          Emergency Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                category === cat.id
                  ? "bg-red-600 text-white border-red-600 font-bold shadow"
                  : "bg-card border-border hover:bg-muted text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick optional note */}
      <div className="w-full space-y-1">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Brief details (e.g. fallen 5m, head wound)..."
          className="w-full px-3 py-2 text-xs border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Large Cancel Button */}
      <div className="w-full pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full h-14 text-base font-bold border-2 border-foreground hover:bg-muted"
        >
          Cancel SOS
        </Button>
      </div>
    </div>
  )
}
