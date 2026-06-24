"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Wifi, WifiOff, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useSettingsStore } from "@/store/settings-store";
import { useRealtimeNotices } from "@/hooks/use-realtime-data";
import { NotificationList } from "@/components/shared/notification-list";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const view = useSearchParams().get("view");
  const pathname = usePathname();
  const online = useUIStore((s) => s.online);
  const settings = useSettingsStore((s) => s.settings);
  const unread = useUIStore((s) => s.unreadNoticeIds.length);
  const markAllRead = useUIStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);

  const { data: notices } = useRealtimeNotices({ limit: 30 });

  // Hide on dashboard/login routes — they provide their own headers
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/student-dashboard")
  ) {
    return null;
  }

  const titles: Record<string, string> = {
    home: settings.siteName,
    "master-calendar": "Master Routine",
    student: "Student View",
    library: "Library",
  };
  const currentTitle = titles[view ?? "home"] ?? settings.siteName;

  return (
    <header className="sticky top-0 z-40 lg:hidden glass-premium border-b border-border/60 pt-safe">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/?view=home" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-teal-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm text-gradient-primary line-clamp-1">{currentTitle}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{settings.academicSession}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full",
              online ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          </div>

          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="relative h-9 w-9 rounded-full bg-accent/80 flex items-center justify-center text-foreground/80 hover:bg-accent">
                <Bell className="h-4.5 w-4.5" />
                <AnimatePresence>
                  {unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center badge-glow text-red-500"
                    >
                      {unread > 9 ? "9+" : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-2xl">
              <SheetHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Notifications
                  </SheetTitle>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
              </SheetHeader>
              <div className="overflow-y-auto h-[calc(80vh-3.5rem)] scrollbar-premium">
                <NotificationList notices={notices ?? []} loading={!notices} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
