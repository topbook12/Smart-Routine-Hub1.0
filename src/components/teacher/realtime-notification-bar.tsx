"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  MapPin,
  X,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useRealtimeScheduleChanges } from "@/hooks/use-realtime-data";
import type { ScheduleChange } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  teacherId?: string;
}

function iconFor(change: ScheduleChange) {
  switch (change.changeType) {
    case "cancelled":
      return { Icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" };
    case "rescheduled":
      return { Icon: CalendarClock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" };
    case "room_changed":
      return { Icon: MapPin, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30" };
    case "extra_class":
      return { Icon: Sparkles, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" };
    default:
      return { Icon: AlertCircle, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30" };
  }
}

function messageFor(change: ScheduleChange): string {
  const course = change.courseCode ? `${change.courseCode}` : "Class";
  switch (change.changeType) {
    case "cancelled":
      return `${course} on ${change.originalDay ?? ""} ${change.originalStartTime ?? ""} was cancelled${change.reason ? ` — ${change.reason}` : ""}`;
    case "rescheduled":
      return `${course} moved → ${change.newDay ?? ""} ${change.newStartTime ?? ""} (Room ${change.newRoomNumber ?? "?"})`;
    case "room_changed":
      return `${course} room changed → Room ${change.newRoomNumber ?? "?"} on ${change.newDay ?? ""}`;
    case "extra_class":
      return `Extra ${course} added → ${change.newDay ?? ""} ${change.newStartTime ?? ""} (Room ${change.newRoomNumber ?? "?"})`;
    default:
      return "Schedule updated";
  }
}

export function RealtimeNotificationBar({ teacherId }: Props) {
  const { data: changes } = useRealtimeScheduleChanges(
    teacherId ? { teacherId } : {}
  );
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const latest = useMemo(() => {
    if (!changes || changes.length === 0) return null;
    // Most recent active change that hasn't been dismissed (within last 24h)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (
      changes.find(
        (c) =>
          c.isActive &&
          !dismissed.has(c.id) &&
          new Date(c.createdAt).getTime() > cutoff
      ) ?? null
    );
  }, [changes, dismissed]);

  return (
    <AnimatePresence>
      {latest && (
        <motion.div
          key={latest.id}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[640px] z-50"
        >
          {(() => {
            const { Icon, color, bg, border } = iconFor(latest);
            return (
              <div
                className={cn(
                  "glass-premium rounded-2xl border px-3 py-2.5 flex items-center gap-3 shadow-2xl",
                  border
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center",
                    bg
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5", color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Schedule Update
                  </p>
                  <p className="text-xs sm:text-sm font-medium line-clamp-2">
                    {messageFor(latest)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDismissed((prev) => new Set(prev).add(latest.id))
                  }
                  className="h-7 w-7 shrink-0 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
