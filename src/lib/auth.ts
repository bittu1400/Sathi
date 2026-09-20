import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProfile as getProfileById } from "@/lib/db/queries"
import type { Profile, Role } from "@/lib/types"

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Throws on a database error, so a failed read is never mistaken for "no access". */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return getProfileById(supabase, user.id)
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
