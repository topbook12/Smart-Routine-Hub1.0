"use client";

import { useState, useEffect } from "react";
import type { DayOfWeek } from "@/types";

const DAY_NAMES: DayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Returns the current day-of-week name, but ONLY on the client after mount.
 * Returns null during SSR and the first client render to avoid hydration
 * mismatches (the server may run in a different timezone, or the day may
 * change between server render and client hydration).
 *
 * Usage: `const today = useToday(); if (!today) return null;` or guard the
 * rendering of today-specific UI with `today && ...`.
 */
export function useToday(): DayOfWeek | null {
  const [today, setToday] = useState<DayOfWeek | null>(null);

  useEffect(() => {
    setToday(DAY_NAMES[new Date().getDay()]);
  }, []);

  return today;
}
