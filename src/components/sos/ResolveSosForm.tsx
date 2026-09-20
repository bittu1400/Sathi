"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/field"

/** "I'm safe now" with an optional note (SPEC §9.1 step 5). */
export function ResolveSosForm({ onResolve }: { onResolve: (note: string) => Promise<void> }) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const id = React.useId()

  if (!open) {
    return (
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        I&apos;m safe now
      </Button>
    )
  }

  return (
    <form
      className="space-y-3 rounded-[var(--radius)] border border-line bg-surface-2 p-3"
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
      <div className="space-y-1.5">
        <Label htmlFor={id}>Confirm you are safe</Label>
        <Input id={id} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (e.g. reached the teahouse)" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Back
        </Button>
        <Button type="submit" state={busy ? "busy" : "idle"}>
          Confirm safe
        </Button>
      </div>
    </form>
  )
}
