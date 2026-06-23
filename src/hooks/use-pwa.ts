"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

// Tracks online/offline status and PWA install prompt availability.
export function usePWA() {
  const setOnline = useUIStore((s) => s.setOnline);
  const setInstallPromptAvailable = useUIStore((s) => s.setInstallPromptAvailable);
  const installPromptAvailable = useUIStore((s) => s.installPromptAvailable);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(navigator.onLine);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // stash the event on window so the install button can trigger it
      (window as unknown as { __deferredPrompt?: Event }).__deferredPrompt = e;
      setInstallPromptAvailable(true);
    };
    const onAppInstalled = () => {
      setInstallPromptAvailable(false);
      (window as unknown as { __deferredPrompt?: Event }).__deferredPrompt = undefined;
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [setOnline, setInstallPromptAvailable]);

  const promptInstall = async (): Promise<boolean> => {
    const deferred = (window as unknown as { __deferredPrompt?: Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } }).__deferredPrompt;
    if (!deferred) return false;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPromptAvailable(false);
      return true;
    }
    return false;
  };

  return { installPromptAvailable, promptInstall };
}
