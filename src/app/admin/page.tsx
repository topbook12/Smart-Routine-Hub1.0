"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  Home,
  LayoutDashboard,
  Library,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-realtime-data";
import { useSettingsStore } from "@/store/settings-store";
import { LoadingState } from "@/components/shared/states";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { AdminDashboardSection } from "@/components/admin/dashboard-section";
import { TeachersSection } from "@/components/admin/teachers-section";
import { CoursesSection } from "@/components/admin/courses-section";
import { RoomsSection } from "@/components/admin/rooms-section";
import { SchedulesSection } from "@/components/admin/schedules-section";
import { NoticesSection } from "@/components/admin/notices-section";
import { LibrarySection } from "@/components/admin/library-section";
import { SettingsSection } from "@/components/admin/settings-section";

type SectionKey =
  | "dashboard"
  | "teachers"
  | "courses"
  | "rooms"
  | "schedules"
  | "notices"
  | "library"
  | "settings";

const NAV: { key: SectionKey; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "teachers", label: "Teachers", Icon: Users },
  { key: "courses", label: "Courses", Icon: BookOpen },
  { key: "rooms", label: "Rooms", Icon: MapPin },
  { key: "schedules", label: "Schedules", Icon: CalendarDays },
  { key: "notices", label: "Notices", Icon: Bell },
  { key: "library", label: "Library", Icon: Library },
  { key: "settings", label: "Settings", Icon: Settings },
];

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: userResp } = useCurrentUser();
  const settings = useSettingsStore((s) => s.settings);
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Redirect unauthenticated users in an effect (never during render).
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Loading admin panel…" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Redirecting to login…" />
      </div>
    );
  }

  const user = userResp?.user;
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-3d card-inner-glow p-8 text-center max-w-md"
        >
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="font-bold text-lg mb-1">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This area is restricted to administrators. Your account doesn&apos;t have admin privileges.
          </p>
          <Button onClick={() => router.replace("/")} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Home className="h-4 w-4" /> Back to site
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingState /></div>;
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-teal-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-gradient-primary truncate">{settings.siteName}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user.fullName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-premium">
        {NAV.map(({ key, label, Icon }) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => {
                setSection(key);
                setMobileNavOpen(false);
              }}
              className={cn(
                "relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-glow"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-border/60 space-y-1">
        <div className="flex items-center justify-between px-3 py-1 mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => router.push("/?view=home")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <Home className="h-4 w-4" /> Back to site
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  const current = NAV.find((n) => n.key === section);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 glass-premium sticky top-14 lg:top-16 self-start h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)]">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 glass-premium border-b border-border/60 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="h-9 w-9 rounded-lg bg-accent/80 flex items-center justify-center"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {current && <current.Icon className="h-4 w-4 text-primary shrink-0" />}
            <span className="font-semibold text-sm truncate">{current?.label}</span>
          </div>
        </header>

        {/* Desktop section header */}
        <header className="hidden lg:flex sticky top-14 lg:top-16 z-20 glass-premium border-b border-border/60 px-6 h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            {current && (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white">
                <current.Icon className="h-4 w-4" />
              </div>
            )}
            <h1 className="font-bold text-base">{current?.label}</h1>
          </div>
          <div className="text-xs text-muted-foreground hidden xl:block">
            {settings.departmentName}
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {section === "dashboard" && <AdminDashboardSection onNavigate={setSection} />}
              {section === "teachers" && <TeachersSection />}
              {section === "courses" && <CoursesSection />}
              {section === "rooms" && <RoomsSection />}
              {section === "schedules" && <SchedulesSection />}
              {section === "notices" && <NoticesSection />}
              {section === "library" && <LibrarySection />}
              {section === "settings" && <SettingsSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
