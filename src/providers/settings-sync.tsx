"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useSettings } from "@/hooks/use-realtime-data";
import { DEFAULT_SETTINGS } from "@/types";

export function SettingsSync() {
  const { data } = useSettings();
  const setSettings = useSettingsStore((s) => s.setSettings);

  useEffect(() => {
    if (data) setSettings({ ...DEFAULT_SETTINGS, ...data });
  }, [data, setSettings]);

  return null;
}
