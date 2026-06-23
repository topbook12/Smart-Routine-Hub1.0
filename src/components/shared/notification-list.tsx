"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  MapPin,
  Pin,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import type { Notice } from "@/types";
import { useUIStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICONS: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
  schedule_change: { Icon: CalendarClock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  academic: { Icon: Bell, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  exam: { Icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  event: { Icon: CalendarClock, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10" },
  general: { Icon: Bell, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10" },
};

function iconFor(notice: Notice) {
  if (notice.changeType === "cancelled") return { Icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
  if (notice.changeType === "rescheduled") return { Icon: CalendarClock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  if (notice.changeType === "room_changed") return { Icon: MapPin, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10" };
  if (notice.changeType === "extra_class") return { Icon: CalendarClock, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
  return ICONS[notice.category] ?? ICONS.general;
}

export function NotificationList({ notices, loading }: { notices: Notice[]; loading: boolean }) {
  const unread = useUIStore((s) => s.unreadNoticeIds);
  const markRead = useUIStore((s) => s.markRead);

  // Track new notice ids as unread
  useEffect(() => {
    // No-op: unread tracking is handled at the store level by other components
  }, [notices]);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/60 shimmer" />
        ))}
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No notifications yet</p>
        <p className="text-xs mt-1">Class changes and notices will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2.5">
      {notices.map((notice, i) => {
        const { Icon, color, bg } = iconFor(notice);
        const isUnread = unread.includes(notice.id);
        return (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            onClick={() => markRead(notice.id)}
            className={cn(
              "relative rounded-xl border p-3.5 cursor-pointer transition-all hover:shadow-md",
              isUnread ? "border-primary/40 bg-primary/[0.03]" : "border-border bg-card/60"
            )}
          >
            {isUnread && (
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 badge-glow text-emerald-500" />
            )}
            <div className="flex items-start gap-3">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bg)}>
                <Icon className={cn("h-4.5 w-4.5", color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {notice.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                  <h4 className="font-semibold text-sm line-clamp-1">{notice.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notice.content}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.affectedProgram && (
                    <Badge variant="outline" className="text-[10px] h-5 uppercase">{notice.affectedProgram}</Badge>
                  )}
                  {notice.affectedSemester && (
                    <Badge variant="outline" className="text-[10px] h-5">Sem {notice.affectedSemester}</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
