"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Field, Input } from "@/components/ui/field"
import { Panel } from "@/components/ui/panel"
import { SaveState, type SaveStateValue } from "@/components/ui/save-state"
import { Skeleton } from "@/components/ui/skeleton"
import { runWithUndo } from "@/components/ui/use-undo"
import { getRoute } from "@/lib/data"
import { useConnectivity } from "@/lib/offline/status"
import { deletePack, listPacks, type PackMeta } from "@/lib/offline/packs"
import { sessionStore } from "@/lib/session"
import type { Terrain } from "@/lib/types"

const TERRAIN_OPTIONS: { id: Terrain; label: string }[] = [
  { id: "river_valley", label: "River valley" },
  { id: "forest", label: "Forest" },
  { id: "alpine", label: "Alpine" },
  { id: "ridge", label: "Ridge" },
  { id: "glacier", label: "Glacier" },
  { id: "cultural", label: "Cultural" },
]

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g. +9779801234567)")

const SECTIONS = [
  ["profile", "Profile"],
  ["contact", "Emergency contact"],
  ["trekking", "Trekking profile"],
  ["packs", "Offline packs"],
  ["privacy", "Privacy and data"],
  ["account", "Account"],
] as const

const megabytes = (bytes: number) => `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`

export default function SettingsPage() {
  const router = useRouter()
  const { online } = useConnectivity()
  const cached = sessionStore.useValue()
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  const [displayName, setDisplayName] = React.useState("")
  const [contactName, setContactName] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")
  const [phoneError, setPhoneError] = React.useState<string | undefined>()
  const [fitness, setFitness] = React.useState<"low" | "medium" | "high" | "">("")
  const [selectedTerrains, setSelectedTerrains] = React.useState<Terrain[]>([])
  const [saved, setSaved] = React.useState<Record<string, SaveStateValue>>({})
  const [packs, setPacks] = React.useState<PackMeta[]>([])
  const [removed, setRemoved] = React.useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const setSave = (key: string, state: SaveStateValue) => setSaved((s) => ({ ...s, [key]: state }))

  React.useEffect(() => {
    listPacks()
      .then(setPacks)
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login?next=/settings")
          return
        }
        setUserId(user.id)

        const { data: profile, error: loadErr } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        // Keep the form hidden: saving an empty form would blank the stored profile.
        if (loadErr) {
          setLoadError(`Couldn't load your settings: ${loadErr.message}`)
          return
        }
        if (profile) {
          setDisplayName(profile.display_name || "")
          setContactName(profile.emergency_contact_name || "")
          setContactPhone(profile.emergency_contact_phone || "")
          setFitness(profile.fitness || "")
          if (profile.preferences?.terrain) setSelectedTerrains(profile.preferences.terrain)
        }
        setLoading(false)
      } catch {
        // Offline: show what this phone last saw, read-only.
        if (cached) {
          setDisplayName(cached.displayName)
          setContactName(cached.emergencyContactName ?? "")
          setContactPhone(cached.emergencyContactPhone ?? "")
          setLoading(false)
        } else {
          setLoadError("You're offline and there's no saved profile on this phone yet.")
        }
      }
    }

    loadProfile()
    // Load once; `cached` is only a fallback read.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the profile must not reload when the cached session changes
  }, [router])

  /** Each section saves only its own columns. */
  const saveSection = async (key: string, values: Record<string, unknown>) => {
    setMessage(null)
    setSave(key, "saving")
    try {
      const supabase = createClient()
      if (!userId) throw new Error("Not authenticated.")
      const { error: updateError } = await supabase.from("profiles").update(values).eq("id", userId)
      if (updateError) throw updateError
      setSave(key, "saved")
    } catch (err: unknown) {
      setSave(key, "error")
      setMessage(err instanceof Error ? err.message : "Failed to update settings.")
    }
  }

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault()
    const phone = contactPhone.trim()
    if (phone) {
      const validation = phoneSchema.safeParse(phone)
      if (!validation.success) return setPhoneError(validation.error.issues[0]?.message || "Invalid phone number.")
    }
    setPhoneError(undefined)
    void saveSection("contact", { emergency_contact_name: contactName.trim() || null, emergency_contact_phone: phone || null })
  }

  const handleSignOut = async () => {
    const { error } = await createClient().auth.signOut()
    if (error) return setMessage(error.message)
    router.push("/login")
    router.refresh()
  }

  const handleDeleteData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Deleting profile row triggers cascade on treks and data per schema
      const { data: deleted, error: deleteError } = await supabase.from("profiles").delete().eq("id", user.id).select("id")

      if (deleteError) throw deleteError
      // RLS turns a refused delete into "0 rows"; never tell the user data is gone when it isn't.
      if (deleted?.length !== 1) throw new Error("Your data could not be deleted. Please try again or contact the team.")
      localStorage.removeItem("sathiSession")
      localStorage.removeItem("sathiTrekLog")
      localStorage.removeItem("sathiLatestSos")

      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Could not delete profile data.")
      setShowDeleteDialog(false)
    }
  }

  const removePack = (meta: PackMeta) =>
    runWithUndo({
      apply: () => setRemoved((r) => new Set(r).add(meta.routeId)),
      revert: () =>
        setRemoved((r) => {
          const next = new Set(r)
          next.delete(meta.routeId)
          return next
        }),
      commit: () => deletePack(meta.routeId),
      message: "Offline pack removed",
    })

  const toggleTerrain = (t: Terrain) =>
    setSelectedTerrains((cur) => (cur.includes(t) ? cur.filter((item) => item !== t) : [...cur, t]))

  if (loading) {
    return loadError ? (
      <Banner severity="danger" headline={loadError} />
    ) : (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton shape="panel" />
        <Skeleton shape="panel" />
      </div>
    )
  }

  const readOnly = !online
  const visiblePacks = packs.filter((p) => !removed.has(p.routeId))

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,40rem)]">
      <nav aria-label="Settings sections" className="hidden lg:block">
        <ul className="sticky top-20 space-y-1">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="flex min-h-10 items-center rounded-[var(--radius)] px-3 text-body text-text-muted hover:bg-surface-2 hover:text-text">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-4">
        <h1 className="text-h1">Settings</h1>
        {readOnly && <Banner severity="caution" headline="Offline. Showing the profile saved on this phone." reasons={["Changes need signal, so the fields are read-only."]} />}
        {message && <Banner severity="danger" headline={message} />}

        <Panel id="profile" title="Profile" className="scroll-mt-20">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void saveSection("profile", { display_name: displayName.trim() || "Trekker" })
            }}
          >
            <Field label="Display name">{(p) => <Input {...p} value={displayName} disabled={readOnly} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Maya" autoComplete="name" />}</Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={readOnly} state={saved.profile === "saving" ? "busy" : "idle"}>
                Save
              </Button>
              <SaveState state={saved.profile ?? "idle"} />
            </div>
          </form>
        </Panel>

        <Panel id="contact" title="Emergency contact" className="scroll-mt-20">
          <form className="space-y-4" onSubmit={saveContact}>
            <p className="text-small text-text-muted">The offline SOS text message goes to this contact first, and coordinators see it.</p>
            <Field label="Contact name">
              {(p) => <Input {...p} value={contactName} disabled={readOnly} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Pasang Sherpa (brother)" autoComplete="off" />}
            </Field>
            <Field label="Contact phone" hint="Include the country code, e.g. +977 for Nepal." error={phoneError}>
              {(p) => <Input {...p} type="tel" inputMode="tel" className="font-mono" value={contactPhone} disabled={readOnly} onChange={(e) => setContactPhone(e.target.value)} placeholder="+9779801234567" autoComplete="off" />}
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={readOnly} state={saved.contact === "saving" ? "busy" : "idle"}>
                Save
              </Button>
              <SaveState state={saved.contact ?? "idle"} />
            </div>
          </form>
        </Panel>

        <Panel id="trekking" title="Trekking profile" className="scroll-mt-20">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void saveSection("trekking", { fitness: fitness || null, preferences: { terrain: selectedTerrains } })
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-small font-medium">Fitness level</legend>
              <ChipGroup>
                {(["low", "medium", "high"] as const).map((level) => (
                  <Chip key={level} selected={fitness === level} disabled={readOnly} onClick={() => setFitness(level)} className="capitalize">
                    {level}
                  </Chip>
                ))}
              </ChipGroup>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-small font-medium">Terrain you like</legend>
              <ChipGroup>
                {TERRAIN_OPTIONS.map((opt) => (
                  <Chip key={opt.id} selected={selectedTerrains.includes(opt.id)} disabled={readOnly} onClick={() => toggleTerrain(opt.id)}>
                    {opt.label}
                  </Chip>
                ))}
              </ChipGroup>
            </fieldset>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={readOnly} state={saved.trekking === "saving" ? "busy" : "idle"}>
                Save
              </Button>
              <SaveState state={saved.trekking ?? "idle"} />
            </div>
          </form>
        </Panel>

        <Panel id="packs" title="Offline packs" className="scroll-mt-20">
          {visiblePacks.length === 0 ? (
            <p className="text-text-muted">No offline packs on this phone. Download one from a route page.</p>
          ) : (
            <ul className="divide-y divide-line">
              {visiblePacks.map((p) => (
                <li key={p.routeId} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="text-body">{getRoute(p.routeId)?.name ?? p.routeId}</p>
                    <p className="font-mono text-small tabular-nums text-text-muted">
                      {megabytes(p.sizeBytes)} · {new Date(p.downloadedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => removePack(p)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel id="privacy" title="Privacy and data" className="scroll-mt-20">
          <div className="space-y-3">
            <p className="text-text-muted">Deletes your profile, treks, check-ins and tracks from this phone and the server. It can&apos;t be undone.</p>
            <Button variant="danger" disabled={readOnly} onClick={() => setShowDeleteDialog(true)}>
              Delete my data
            </Button>
          </div>
        </Panel>

        <Panel id="account" title="Account" className="scroll-mt-20">
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </Panel>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete your data?"
        body="All your profile information, recorded tracks and trek history will be permanently deleted. This can't be undone."
        confirmLabel="Delete data"
        tone="danger"
        requireText="DELETE"
        onConfirm={handleDeleteData}
      />
    </div>
  )
}
