"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export function PWARegister() {
  const setOnline = useUIStore((s) => s.setOnline);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW registration failures are non-fatal */
      });
    }
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOnline]);

  return null;
}
