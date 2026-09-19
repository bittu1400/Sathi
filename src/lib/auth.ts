import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Role } from "@/lib/types"

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role as Role,
    agencyId: profile.agency_id,
    emergencyContactName: profile.emergency_contact_name,
    emergencyContactPhone: profile.emergency_contact_phone,
    fitness: profile.fitness as Profile["fitness"],
    preferences: profile.preferences as Profile["preferences"],
  }
}

export async function requireUser(nextUrl?: string) {
  const user = await getUser()
  if (!user) {
    const query = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""
    redirect(`/login${query}`)
  }
  return user
}

export async function requireRole(requiredRole: Role, nextUrl?: string): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getUser>>>; profile: Profile }> {
  const user = await requireUser(nextUrl)
  const profile = await getProfile()

  if (!profile || profile.role !== requiredRole) {
    redirect("/login?error=unauthorized")
  }

  return { user, profile }
}
