"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SiteSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

interface SettingsState {
  settings: SiteSettings;
  isLoaded: boolean;
  setSettings: (s: SiteSettings) => void;
  setLoaded: (b: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      isLoaded: false,
      setSettings: (s) => set({ settings: s, isLoaded: true }),
      setLoaded: (b) => set({ isLoaded: b }),
    }),
    { name: "srh-settings" }
  )
);
