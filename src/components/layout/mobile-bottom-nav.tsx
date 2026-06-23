"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, GraduationCap, Home, Bell } from "lucide-react";
import { useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useRealtimeNotices } from "@/hooks/use-realtime-data";
import { NotificationList } from "@/components/shared/notification-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "home", label: "Home", href: "/?view=home", icon: Home },
  { key: "master-calendar", label: "Master", href: "/?view=master-calendar", icon: CalendarDays },
  { key: "student", label: "Student", href: "/?view=student", icon: GraduationCap },
];

export function MobileBottomNav() {
  const view = useSearchParams().get("view");
  const pathname = usePathname();
  const unread = useUIStore((s) => s.unreadNoticeIds.length);
  const markAllRead = useUIStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const { data: notices } = useRealtimeNotices({ limit: 30 });

  // Hide on admin/teacher pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/teacher") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-premium border-t border-border/60 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {TABS.map((tab) => {
            const active = (view ?? "home") === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="relative flex flex-col items-center justify-center gap-0.5"
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-active"
                    className="absolute top-0 h-1 w-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-teal-glow"
                      : "text-foreground/60"
                  )}
                >
                  <tab.icon className="h-4.5 w-4.5" />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-primary" : "text-foreground/60"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="relative flex flex-col items-center justify-center gap-0.5">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl text-foreground/60"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center badge-glow text-red-500">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </motion.div>
                <span className="text-[10px] font-medium text-foreground/60">Alerts</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-2xl">
              <SheetHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Notifications
                  </SheetTitle>
                  <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">
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
      </nav>
    </>
  );
}
