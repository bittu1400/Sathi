"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { Terrain } from "@/lib/types"

const TERRAIN_OPTIONS: { id: Terrain; label: string }[] = [
  { id: "river_valley", label: "River Valley" },
  { id: "forest", label: "Forest" },
  { id: "alpine", label: "Alpine" },
  { id: "ridge", label: "Ridge" },
  { id: "glacier", label: "Glacier" },
  { id: "cultural", label: "Cultural" },
]

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g. +9779801234567)")

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const [displayName, setDisplayName] = React.useState("")
  const [contactName, setContactName] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")
  const [fitness, setFitness] = React.useState<"low" | "medium" | "high" | "">("")
  const [selectedTerrains, setSelectedTerrains] = React.useState<Terrain[]>([])

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login?next=/settings")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || "")
        setContactName(profile.emergency_contact_name || "")
        setContactPhone(profile.emergency_contact_phone || "")
        setFitness(profile.fitness || "")
        if (profile.preferences?.terrain) {
          setSelectedTerrains(profile.preferences.terrain)
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate phone if provided
    if (contactPhone.trim()) {
      const validation = phoneSchema.safeParse(contactPhone.trim())
      if (!validation.success) {
        setMessage({ type: "error", text: validation.error.issues[0]?.message || "Invalid phone number." })
        return
      }
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated.")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || "Trekker",
          emergency_contact_name: contactName.trim() || null,
          emergency_contact_phone: contactPhone.trim() || null,
          fitness: fitness || null,
          preferences: {
            terrain: selectedTerrains,
          },
        })
        .eq("id", user.id)

      if (updateError) throw updateError
      setMessage({ type: "success", text: "Settings saved successfully." })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message })
      } else {
        setMessage({ type: "error", text: "Failed to update settings." })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleDeleteData = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Deleting profile row triggers cascade on treks and data per schema
      const { data: deleted, error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id)
        .select("id")

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
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message })
      } else {
        setMessage({ type: "error", text: "Could not delete profile data." })
      }
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
    }
  }

  const toggleTerrain = (t: Terrain) => {
    if (selectedTerrains.includes(t)) {
      setSelectedTerrains(selectedTerrains.filter((item) => item !== t))
    } else {
      setSelectedTerrains([...selectedTerrains, t])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <p className="text-sm text-text-muted">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text py-8 px-4 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-text-muted">
          Manage your profile, emergency contacts, and trekking preferences.
        </p>
      </div>

      {message && (
        <div
          role="alert"
          className={`p-3 text-sm rounded-lg border ${
            message.type === "success"
              ? "bg-ok/10 border-ok text-ok"
              : "bg-danger/10 border-danger text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Info */}
        <section className="p-4 rounded-xl border border-border bg-surface space-y-4">
          <h2 className="text-lg font-semibold">Trekker Profile</h2>
          <div className="space-y-1">
            <label htmlFor="displayName" className="block text-sm font-medium">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maya"
              className="w-full px-3 py-2 border border-border rounded-md bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="p-4 rounded-xl border border-border bg-surface space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Emergency Contact</h2>
            <p className="text-xs text-text-muted">
              Used for offline SOS SMS dispatch and rescue coordinator hand-off.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="contactName" className="block text-sm font-medium">
                Contact Name
              </label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Pasang Sherpa (Brother)"
                className="w-full px-3 py-2 border border-border rounded-md bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contactPhone" className="block text-sm font-medium">
                Contact Phone (E.164 Format)
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+9779801234567"
                className="w-full px-3 py-2 border border-border rounded-md bg-bg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-text-muted">
                Must include country code (e.g. +977 for Nepal).
              </p>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="p-4 rounded-xl border border-border bg-surface space-y-4">
          <h2 className="text-lg font-semibold">Trekking Profile</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Fitness Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setFitness(level)}
                  className={`px-3 py-2 text-sm rounded-md border text-center capitalize transition-colors ${
                    fitness === level
                      ? "border-accent bg-accent/10 text-accent font-medium"
                      : "border-border hover:bg-surface-2"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Terrain Preferences</label>
            <div className="flex flex-wrap gap-2">
              {TERRAIN_OPTIONS.map((opt) => {
                const active = selectedTerrains.includes(opt.id)
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => toggleTerrain(opt.id)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      active
                        ? "border-accent bg-accent text-accent-ink font-medium"
                        : "border-border hover:bg-surface-2 text-text-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Downloaded Packs (A-06 slot) */}
        <section className="p-4 rounded-xl border border-border bg-surface space-y-2">
          <h2 className="text-lg font-semibold">Offline Map Packs</h2>
          <p className="text-xs text-text-muted">
            Offline route packs downloaded to this device will appear here.
          </p>
          <div className="p-4 rounded-lg bg-surface-2/50 border border-dashed border-border text-center text-xs text-text-muted">
            No offline packs downloaded yet. Packs can be downloaded from any route detail page.
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>

          <Button type="button" variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <section className="pt-6 border-t border-border space-y-3">
        <h3 className="text-sm font-semibold text-danger">Danger Zone</h3>
        <p className="text-xs text-text-muted">
          Permanently delete your profile and active trek data from this device and the server.
        </p>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete My Data
        </Button>
      </section>

      {/* Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4"
        >
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-lg font-bold">Delete your data?</h4>
            <p className="text-xs text-text-muted">
              This action cannot be undone. All your profile information, recorded tracks, and trek history will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={deleting}
                onClick={handleDeleteData}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
