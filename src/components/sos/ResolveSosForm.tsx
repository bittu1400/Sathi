"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

/** "I'm safe now" with an optional note (SPEC §9.1 step 5). */
export function ResolveSosForm({ onResolve }: { onResolve: (note: string) => Promise<void> }) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  if (!open) {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        I&apos;m safe now
      </Button>
    )
  }

  return (
    <form
      className="space-y-3 rounded-[var(--radius)] border border-border bg-surface-2 p-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        try {
          await onResolve(note)
        } finally {
          setBusy(false)
        }
      }}
    >
      <label className="block space-y-1 text-sm font-semibold text-text">
        <span>Confirm you are safe</span>
        <input
          type="text"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (e.g. reached the teahouse)"
          className="h-12 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Back
        </Button>
        <Button type="submit" loading={busy}>
          Confirm safe
        </Button>
      </div>
    </form>
  )
}
