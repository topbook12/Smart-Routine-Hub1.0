"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MapPin,
  CalendarDays,
  Bell,
  Library,
  Settings,
  LogOut,
  Sparkles,
  Home,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

export type AdminSection =
  | "dashboard"
  | "teachers"
  | "courses"
  | "rooms"
  | "schedules"
  | "notices"
  | "library"
  | "settings";

export const ADMIN_NAV: {
  key: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Overview & stats" },
  { key: "teachers", label: "Teachers", icon: Users, hint: "Manage faculty" },
  { key: "courses", label: "Courses", icon: BookOpen, hint: "Course catalog" },
  { key: "rooms", label: "Rooms", icon: MapPin, hint: "Classrooms & labs" },
  { key: "schedules", label: "Schedules", icon: CalendarDays, hint: "Class routines" },
  { key: "notices", label: "Notices", icon: Bell, hint: "Announcements" },
  { key: "library", label: "Library", icon: Library, hint: "Resource links" },
  { key: "settings", label: "Settings", icon: Settings, hint: "Site configuration" },
];

function BrandBlock() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 group">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-teal-glow shrink-0">
        <Sparkles className="h-5 w-5 text-white" />
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/30" />
      </div>
      <div className="leading-tight min-w-0">
        <div className="font-bold text-sm text-gradient-primary truncate">Admin Console</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Smart Routine Hub
        </div>
      </div>
    </Link>
  );
}

function UserBlock({ user }: { user: User | null | undefined }) {
  const initial = (user?.fullName || user?.email || "A").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border border-teal-500/20">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-teal-glow shrink-0">
        {initial}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold truncate">{user?.fullName || "Admin User"}</div>
        <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
      </div>
    </div>
  );
}

function NavItems({
  active,
  onSelect,
}: {
  active: AdminSection;
  onSelect: (key: AdminSection) => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {ADMIN_NAV.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              isActive
                ? "text-primary-foreground"
                : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="admin-nav-active"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-glow"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3 min-w-0">
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex flex-col min-w-0">
                <span className="truncate">{item.label}</span>
                <span
                  className={cn(
                    "text-[10px] truncate",
                    isActive ? "text-white/70" : "text-muted-foreground/70"
                  )}
                >
                  {item.hint}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function BottomActions({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-2 px-2 pb-3">
      <Link
        href="/?view=home"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-accent/60 transition-colors"
      >
        <Home className="h-3.5 w-3.5" /> Back to public site
      </Link>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}

export function AdminSidebar({
  active,
  onSelect,
  user,
}: {
  active: AdminSection;
  onSelect: (key: AdminSection) => void;
  user: User | null | undefined;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleSelect = (key: AdminSection) => {
    onSelect(key);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Signed out");
    router.replace("/login");
  };

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 w-64 glass-premium border-r border-border/60 flex-col z-30">
        <div className="p-3 border-b border-border/60">
          <BrandBlock />
        </div>
        <div className="p-2">
          <UserBlock user={user} />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-premium py-2">
          <NavItems active={active} onSelect={handleSelect} />
        </div>
        <div className="border-t border-border/60 pt-2">
          <BottomActions onLogout={handleLogout} />
        </div>
      </aside>

      {/* Mobile top bar with hamburger */}
      <header className="lg:hidden sticky top-14 z-30 glass-premium border-b border-border/60">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-background"
            aria-label="Open admin menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-sm text-gradient-primary">
              {ADMIN_NAV.find((n) => n.key === active)?.label ?? "Admin"}
            </span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs">
            {(user?.fullName || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border/60 flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" /> Admin Console
            </SheetTitle>
            <button
              onClick={() => setMobileOpen(false)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>
          <div className="p-3">
            <UserBlock user={user} />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-premium py-2">
            <NavItems active={active} onSelect={handleSelect} />
          </div>
          <div className="border-t border-border/60 pt-2">
            <BottomActions onLogout={handleLogout} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { BrandBlock, UserBlock, NavItems, BottomActions };
