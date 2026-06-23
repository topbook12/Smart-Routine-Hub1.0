"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "light" | "dark";
  online: boolean;
  notificationsEnabled: boolean;
  unreadNoticeIds: string[];
  installPromptAvailable: boolean;
  setTheme: (t: "light" | "dark") => void;
  setOnline: (b: boolean) => void;
  setNotificationsEnabled: (b: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setInstallPromptAvailable: (b: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      online: true,
      notificationsEnabled: false,
      unreadNoticeIds: [],
      installPromptAvailable: false,
      setTheme: (t) => set({ theme: t }),
      setOnline: (b) => set({ online: b }),
      setNotificationsEnabled: (b) => set({ notificationsEnabled: b }),
      markRead: (id) =>
        set((s) => ({ unreadNoticeIds: s.unreadNoticeIds.filter((n) => n !== id) })),
      markAllRead: () => set({ unreadNoticeIds: [] }),
      setInstallPromptAvailable: (b) => set({ installPromptAvailable: b }),
    }),
    {
      name: "srh-ui",
      partialize: (s) => ({
        theme: s.theme,
        notificationsEnabled: s.notificationsEnabled,
      }),
    }
  )
);
