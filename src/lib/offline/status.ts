"use client";

import { useEffect, useState } from "react";

export function useConnectivity() {
  const [online, setOnline] = useState<boolean>(true);
  const [forcedOffline, setForcedOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkForced = () => {
      try {
        const stored = localStorage.getItem("sathiForcedOffline");
        setForcedOffline(stored === "1");
      } catch {
        setForcedOffline(false);
      }
    };

    checkForced();

    const handleOnline = () => setOnline(navigator.onLine);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    online: online && !forcedOffline,
    forcedOffline,
  };
}
