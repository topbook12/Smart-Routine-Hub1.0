"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Bell, BookOpen, CalendarDays, Clock, GraduationCap, Home, LogOut, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useCurrentStudent, useRealtimeSchedules, useRealtimeNotices } from "@/hooks/use-realtime-data";
import { DAYS, type DayOfWeek } from "@/types";
import { LoadingState, EmptyState, StatCard } from "@/components/shared/states";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: studentResp, isLoading: studentLoading } = useCurrentStudent();

  // DEV BYPASS: in development, skip auth so dashboards can be viewed directly.
  // Remove this block to re-enable authentication.
  const isDev = process.env.NODE_ENV !== "production";

  // In dev mode, create a mock student so the dashboard renders without login.
  const devStudent: NonNullable<ReturnType<typeof useCurrentStudent>["data"]>["student"] = {
    id: "dev-student",
    fullName: "Dev Student",
    rollNumber: "30001",
    program: "bsc",
    semester: 1,
    role: "student",
    isActive: true,
  };
  const student = isDev ? (studentResp?.student ?? devStudent) : studentResp?.student;

  // Determine redirect target (if any) — perform the redirect in an effect,
  // never during render, to avoid "setState while rendering" errors.
  const role = (session?.user as { role?: string } | undefined)?.role;
  let redirectTarget: string | null = null;
  if (!isDev) {
    if (status === "unauthenticated") {
      redirectTarget = "/login";
    } else if (status === "authenticated" && role && role !== "student") {
      // Logged in but not a student — send to the right dashboard
      if (role === "admin") redirectTarget = "/admin";
      else if (role === "teacher") redirectTarget = "/teacher";
      else redirectTarget = "/login";
    }
  }

  useEffect(() => {
    if (redirectTarget) router.replace(redirectTarget);
  }, [redirectTarget, router]);

  // Loading: session loading, OR session authenticated as student but
  // /api/student/me hasn't resolved yet (skip in dev).
  if (!isDev && (status === "loading" || (status === "authenticated" && role === "student" && studentLoading && !studentResp))) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingState message="Loading your dashboard…" /></div>;
  }
  if (redirectTarget) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingState message="Redirecting…" /></div>;
  }
  if (!student) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingState /></div>;

  return <StudentDashboard student={student} />;
}

function StudentDashboard({ student }: { student: NonNullable<ReturnType<typeof useCurrentStudent>["data"]>["student"] }) {
  const router = useRouter();
  const today = useToday();
  const { data: schedules, isLoading: schedLoading } = useRealtimeSchedules({ program: student.program, semester: student.semester });
  const { data: allNotices } = useRealtimeNotices({ limit: 50 });

  const myNotices = (allNotices ?? []).filter((n) => {
    if (n.category === "schedule_change") {
      if (n.affectedProgram && n.affectedProgram !== student.program) return false;
      if (n.affectedSemester && n.affectedSemester !== student.semester) return false;
      return true;
    }
    if (n.affectedProgram && n.affectedProgram !== student.program) return false;
    if (n.affectedSemester && n.affectedSemester !== student.semester) return false;
    return true;
  });

  const grouped = new Map<DayOfWeek, typeof schedules>();
  for (const d of DAYS) (grouped as Map<DayOfWeek, typeof schedules>).set(d, []);
  for (const s of schedules ?? []) {
    const arr = grouped.get(s.dayOfWeek as DayOfWeek);
    if (arr) arr.push(s);
  }
  for (const arr of grouped.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayClasses = (schedules ?? []).filter((s) => s.dayOfWeek === today).length;
  const totalClasses = schedules?.length ?? 0;
  const activeDays = new Set(schedules?.map((s) => s.dayOfWeek)).size;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 lg:py-8 pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-3d card-inner-glow p-5 sm:p-6 mb-6 hero-bg relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-ink flex items-center justify-center text-white font-bold text-lg shadow-teal-glow">
              {student.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{student.fullName}</h1>
              <p className="text-xs text-muted-foreground">Roll: {student.rollNumber} · {student.program.toUpperCase()} · Semester {student.semester}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => router.push("/?view=home")} className="gap-1.5 h-9"><Home className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Site</span></Button>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="gap-1.5 h-9 border-destructive/30 text-destructive hover:bg-destructive/10"><LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Logout</span></Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="My Classes" value={totalClasses} icon={CalendarDays} variant="ink" index={0} />
        <StatCard label="Today" value={todayClasses} icon={Clock} variant="gold" index={1} />
        <StatCard label="Active Days" value={activeDays} icon={BookOpen} variant="green" index={2} />
        <StatCard label="My Notices" value={myNotices.length} icon={Bell} variant="ink" index={3} />
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gold-deep" />
          <h2 className="text-lg font-bold">My Notices</h2>
          <Badge variant="outline" className="text-[10px] h-5">{myNotices.length}</Badge>
        </div>
        {myNotices.length === 0 ? (
          <EmptyState icon={Bell} title="No notices for you" message="Notices relevant to your semester will appear here." />
        ) : (
          <div className="space-y-2.5">
            {myNotices.slice(0, 8).map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="card-3d p-3.5">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Bell className="h-4 w-4 text-gold-deep" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {n.isPinned && <Pin className="h-3 w-3 text-gold-deep" />}
                      <h4 className="font-semibold text-sm line-clamp-1">{n.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-gold-deep" />
          <h2 className="text-lg font-bold">My Weekly Schedule</h2>
          <Badge variant="outline" className="text-[10px] h-5">{student.program.toUpperCase()} · Sem {student.semester}</Badge>
        </div>
        {schedLoading ? (
          <LoadingState message="Loading your schedule…" />
        ) : totalClasses === 0 ? (
          <EmptyState icon={CalendarDays} title="No classes found" message={`No active classes for ${student.program.toUpperCase()} Semester ${student.semester}.`} />
        ) : (
          <div className="space-y-6">
            {DAYS.map((d, di) => {
              const items = grouped.get(d) ?? [];
              if (items.length === 0) return null;
              const isToday = d === today;
              return (
                <motion.section key={d} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(di * 0.05, 0.3) }}>
                  <div className={cn("rounded-lg p-3 mb-3 flex items-center justify-between", isToday ? "bg-ink text-white shadow-teal-glow" : "bg-card shadow-[0_1px_3px_rgba(36,28,21,0.05),0_4px_12px_rgba(36,28,21,0.04)]")}>
                    <div className="flex items-center gap-2">
                      <h3 className={cn("font-bold", isToday ? "text-white" : "text-foreground")}>{d}</h3>
                      {isToday && <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">Today</span>}
                    </div>
                    <span className={cn("text-xs", isToday ? "text-white/90" : "text-muted-foreground")}>{items.length} {items.length === 1 ? "class" : "classes"}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((s, i) => <ScheduleCard key={s.id} schedule={s} index={i} />)}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
