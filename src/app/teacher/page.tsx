"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  FileText,
  Home,
  LogOut,
  MoveRight,
  Pencil,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import { useCurrentUser, useRealtimeTeachers } from "@/hooks/use-realtime-data";
import type { User } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/states";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MyScheduleTab } from "@/components/teacher/my-schedule-tab";
import { CancelRescheduleTab } from "@/components/teacher/cancel-reschedule-tab";
import { NoticesTab } from "@/components/teacher/notices-tab";
import { ExtraClassTab } from "@/components/teacher/extra-class-tab";
import { EditScheduleTab } from "@/components/teacher/edit-schedule-tab";
import { ProfileTab } from "@/components/teacher/profile-tab";
import { RealtimeNotificationBar } from "@/components/teacher/realtime-notification-bar";

const TABS = [
  {
    value: "schedule",
    label: "My Schedule",
    icon: CalendarDays,
    short: "Schedule",
  },
  {
    value: "edit",
    label: "Edit Classes",
    icon: Pencil,
    short: "Edit",
  },
  {
    value: "manage",
    label: "Cancel / Reschedule",
    icon: MoveRight,
    short: "Manage",
  },
  {
    value: "notices",
    label: "Notices",
    icon: FileText,
    short: "Notices",
  },
  {
    value: "extra",
    label: "Add Extra Class",
    icon: CalendarPlus,
    short: "Extra",
  },
  {
    value: "profile",
    label: "My Profile",
    icon: UserCog,
    short: "Profile",
  },
] as const;

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: userResp } = useCurrentUser();

  // Derive user directly from the NextAuth session token so the page can
  // render immediately after login without waiting for /api/user to resolve.
  // The full user object (from /api/user) is still preferred when available
  // because it carries extra fields (designation, department, etc.).
  const sessionUser = session?.user as { id?: string; name?: string | null; email?: string | null; role?: string } | undefined;
  const user = userResp?.user ?? (sessionUser && sessionUser.id && sessionUser.role
    ? {
        id: sessionUser.id,
        fullName: sessionUser.name ?? "User",
        email: sessionUser.email ?? "",
        role: sessionUser.role as "admin" | "teacher",
        isActive: true,
      }
    : null);

  // Admin can pick any teacher to view as
  const [adminTeacherId, setAdminTeacherId] = useState<string>("");
  const { data: teachers } = useRealtimeTeachers();

  const [activeTab, setActiveTab] = useState<string>("schedule");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Loading state — only wait for session, not /api/user
  if (status === "loading") {
    return (
      <LoadingState message="Loading your dashboard…" className="min-h-[70vh]" />
    );
  }

  if (status === "unauthenticated") {
    return <LoadingState message="Redirecting to login…" className="min-h-[70vh]" />;
  }

  if (!user) {
    return <LoadingState message="Loading…" className="min-h-[70vh]" />;
  }

  // Access denied for non-teacher/non-admin
  if (user.role !== "teacher" && user.role !== "admin") {
    return <AccessDenied />;
  }

  const isAdmin = user.role === "admin";
  const effectiveUser = user;
  const effectiveTeacherId = isAdmin ? adminTeacherId : effectiveUser.id;

  const effectiveTeacherName = isAdmin
    ? teachers?.find((x) => x.id === adminTeacherId)?.fullName ?? "—"
    : effectiveUser.fullName;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col hero-bg">
      {/* Header */}
      <TeacherHeader user={effectiveUser} onLogout={handleLogout} />

      {/* Admin teacher picker banner */}
      {isAdmin && (
        <AdminTeacherPicker
          teachers={teachers ?? []}
          value={adminTeacherId}
          onChange={setAdminTeacherId}
        />
      )}

      {/* Tabs (mobile nav = top scrollable tabs) */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 pb-32 lg:pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 mb-5">
            <TabsList className="grid grid-cols-4 w-full min-w-[420px] sm:min-w-0 h-auto p-1 rounded-xl bg-muted/60 border border-border">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex-col sm:flex-row h-auto py-2 sm:py-1.5 gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-teal-glow"
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] sm:text-xs font-medium leading-none">
                    {t.short}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="schedule" className="outline-none">
            {effectiveTeacherId ? (
              <MyScheduleTab teacherId={effectiveTeacherId} />
            ) : (
              <PickTeacherPrompt />
            )}
          </TabsContent>

          <TabsContent value="edit" className="outline-none">
            {effectiveTeacherId ? (
              <EditScheduleTab teacherId={effectiveTeacherId} />
            ) : (
              <PickTeacherPrompt />
            )}
          </TabsContent>

          <TabsContent value="manage" className="outline-none">
            {effectiveTeacherId ? (
              <CancelRescheduleTab
                teacherId={effectiveTeacherId}
                teacherName={effectiveTeacherName}
              />
            ) : (
              <PickTeacherPrompt />
            )}
          </TabsContent>

          <TabsContent value="notices" className="outline-none">
            <NoticesTab userId={effectiveUser.id} userName={effectiveUser.fullName} />
          </TabsContent>

          <TabsContent value="extra" className="outline-none">
            {effectiveTeacherId ? (
              <ExtraClassTab
                teacherId={effectiveTeacherId}
                teacherName={effectiveTeacherName}
              />
            ) : (
              <PickTeacherPrompt />
            )}
          </TabsContent>

          <TabsContent value="profile" className="outline-none">
            <ProfileTab userId={effectiveUser.id} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Realtime notification bar */}
      <RealtimeNotificationBar
        teacherId={isAdmin ? adminTeacherId : user.id}
      />
    </div>
  );
}

/* ---------------- Header ---------------- */
function TeacherHeader({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const initial = (user.fullName || user.email).charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <header className="sticky top-0 z-40 glass-premium border-b border-border/60 pt-safe">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: avatar + info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-teal-glow">
            {initial}
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/30" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base text-gradient-primary line-clamp-1">
                {user.fullName}
              </h1>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
              {user.designation ?? "Teacher"}
              {user.department ? ` · ${user.department}` : ""}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Link
            href="/?view=home"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 px-3 rounded-lg text-xs font-medium border border-border bg-card hover:bg-accent transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Site
          </Link>
          <Link
            href="/?view=home"
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent"
            aria-label="Back to site"
          >
            <Home className="h-4 w-4" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="gap-1.5 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Admin Teacher Picker ---------------- */
function AdminTeacherPicker({
  teachers,
  value,
  onChange,
}: {
  teachers: User[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-14 sm:top-16 z-30 mx-auto max-w-7xl px-3 sm:px-6 py-2"
    >
      <div className="card-3d p-3 border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-500/5 flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <UserIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Admin view — pick a teacher
          </p>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-8 mt-0.5 w-full text-xs">
              <SelectValue placeholder="Select a teacher to manage their classes" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.fullName} ({t.designation ?? "Teacher"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}

function PickTeacherPrompt() {
  return (
    <div className="card-3d p-10 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="h-7 w-7 text-amber-500" />
      </div>
      <h3 className="font-semibold text-base mb-1">Select a teacher</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        As an admin, pick a teacher from the dropdown above to view and manage
        their schedule.
      </p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 hero-bg">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="card-3d p-8 text-center max-w-md w-full"
      >
        <div className="h-14 w-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-1.5">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-5">
          This dashboard is only available to teachers and admins. Your account
          doesn&apos;t have the required role.
        </p>
        <Link
          href="/?view=home"
          className="inline-flex h-10 items-center gap-1.5 px-5 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 text-white btn-3d"
        >
          <Home className="h-4 w-4" /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
