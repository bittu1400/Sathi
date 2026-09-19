import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { countRecentAlerts, listActiveTreksWithLatestPosition, listSos } from "@/lib/db/queries";
import { RescueConsole } from "@/components/rescue/RescueConsole";

export const dynamic = "force-dynamic";

export default async function RescuePage() {
  const { user, profile } = await requireRole("coordinator", "/rescue");
  const supabase = await createClient();

  // Render the empty console with an error banner rather than crash the page.
  const [events, treks, alerts24h] = await Promise.all([
    listSos(supabase).catch(() => null),
    listActiveTreksWithLatestPosition(supabase).catch(() => null),
    countRecentAlerts(supabase).catch(() => 0),
  ]);

  return (
    <RescueConsole
      initialEvents={events ?? []}
      initialTreks={treks ?? []}
      initialAlerts24h={alerts24h}
      initialError={events && treks ? null : "Couldn't load live data. Retrying…"}
      coordinatorId={user.id}
      coordinatorName={profile.displayName}
    />
  );
}
