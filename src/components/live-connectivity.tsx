"use client";

import * as React from "react";
import { ConnectivityPill } from "./ui/connectivity-pill";
import { useConnectivity } from "@/lib/offline/status";
import { subscribeOutboxStatus } from "@/lib/outbox";

/** Real connectivity + outbox queue, for the app header. */
export function LiveConnectivityPill() {
  const { online } = useConnectivity();
  const [queued, setQueued] = React.useState(0);

  React.useEffect(() => subscribeOutboxStatus((s) => setQueued(s.pending)), []);

  const status = !online ? "offline" : queued > 0 ? "syncing" : "online";
  return (
    <span aria-live="polite">
      <ConnectivityPill status={status} queuedCount={queued} />
    </span>
  );
}
