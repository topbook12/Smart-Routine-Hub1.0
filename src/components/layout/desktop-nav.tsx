"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, GraduationCap, Home, Library, LogIn, Sparkles, Wifi, WifiOff } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useSettingsStore } from "@/store/settings-store";
import { useCurrentUser } from "@/hooks/use-realtime-data";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/?view=home", icon: Home },
  { label: "Master Routine", href: "/?view=master-calendar", icon: CalendarDays },
  { label: "Student", href: "/?view=student", icon: GraduationCap },
  { label: "Library", href: "/?view=library", icon: Library },
];

function isActive(view: string | null, target: string): boolean {
  if (target === "home") return !view || view === "home";
  return view === target;
}

export function DesktopNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const view = searchParams.get("view");
  const online = useUIStore((s) => s.online);
  const settings = useSettingsStore((s) => s.settings);
  const { data: userResp } = useCurrentUser();
  const user = userResp?.user;

  // Hide on dashboard / login routes (they provide their own chrome)
  if (pathname.startsWith("/admin") || pathname.startsWith("/teacher") || pathname.startsWith("/login") || pathname.startsWith("/student-dashboard")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 hidden lg:block glass-premium border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/?view=home" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-teal-glow">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/30" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base text-gradient-primary">{settings.siteName}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{settings.academicSession}</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(view, item.href.split("=")[1] || "home");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              online ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline">{online ? "Online" : "Offline"}</span>
          </div>

          {user ? (
            <Link
              href={user.role === "admin" ? "/admin" : "/teacher"}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 text-white btn-3d"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 text-white btn-3d flex items-center gap-1.5"
            >
              <LogIn className="h-4 w-4" />
              Teacher Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
