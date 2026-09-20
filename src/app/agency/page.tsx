import type { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getAgencyName, listFleet, listSos } from "@/lib/db/queries"
import { AgencyConsole } from "@/components/rescue/AgencyConsole"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Agency", robots: { index: false } }

export default async function AgencyPage() {
  const { profile } = await requireRole("agency_admin", "/agency")
  const supabase = await createClient()

  const [fleet, sos, agencyName] = await Promise.all([
    listFleet(supabase).catch(() => null),
    listSos(supabase, { unresolvedOnly: true }).catch(() => null),
    profile.agencyId ? getAgencyName(supabase, profile.agencyId).catch(() => null) : null,
  ])

  return (
    <AgencyConsole
      initialFleet={fleet ?? []}
      initialSos={sos ?? []}
      initialError={fleet && sos ? null : "Couldn't load live data. Retrying…"}
      agencyName={agencyName ?? "Your agency"}
      adminName={profile.displayName}
    />
  )
}
