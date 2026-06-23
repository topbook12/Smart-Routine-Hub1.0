"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, CalendarDays, Clock, FlaskConical, GitBranch, GraduationCap, Layers, MapPin, User2 } from "lucide-react";
import {
  useRealtimeSchedules,
  useRealtimeScheduleChanges,
} from "@/hooks/use-realtime-data";
import { DAYS, type Schedule, type DayOfWeek } from "@/types";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { StatCard, LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TODAY_NAME: DayOfWeek = (() => {
  const days: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()] as DayOfWeek;
})();

export function StudentView() {
  const router = useRouter();
  const sp = useSearchParams();
  const [program, setProgram] = useState<"bsc" | "msc">(
    (sp.get("program") as "bsc" | "msc") || "bsc"
  );
  const [semester, setSemester] = useState<string>(sp.get("semester") || "1");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    params.set("view", "student");
    params.set("program", program);
    params.set("semester", semester);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [program, semester]);

  const { data: schedules, isLoading } = useRealtimeSchedules({
    program,
    semester: Number(semester),
  });
  const { data: changes } = useRealtimeScheduleChanges({
    program,
    semester: Number(semester),
  });

  const changeMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof changes>[number]>();
    changes?.forEach((c) => {
      if (c.scheduleId) m.set(c.scheduleId, c);
    });
    return m;
  }, [changes]);

  // Apply changes: filter cancelled, show rescheduled info
  const processed = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .map((s) => {
        const change = changeMap.get(s.id);
        if (change?.changeType === "cancelled") {
          return { ...s, _cancelled: true, _change: change };
        }
        if (change?.changeType === "rescheduled") {
          return {
            ...s,
            dayOfWeek: (change.newDay as DayOfWeek) ?? s.dayOfWeek,
            startTime: change.newStartTime ?? s.startTime,
            endTime: change.newEndTime ?? s.endTime,
            roomNumber: change.newRoomNumber ?? s.roomNumber,
            _moved: true,
            _change: change,
          } as Schedule & { _moved?: boolean; _change?: NonNullable<typeof changes>[number]; _cancelled?: boolean };
        }
        if (change?.changeType === "room_changed") {
          return {
            ...s,
            roomNumber: change.newRoomNumber ?? s.roomNumber,
            _change: change,
          } as Schedule & { _change?: NonNullable<typeof changes>[number] };
        }
        return s as Schedule & { _change?: NonNullable<typeof changes>[number] };
      })
      .filter((s) => !(s as { _cancelled?: boolean })._cancelled);
  }, [schedules, changeMap]);

  const dayCount = useMemo(
    () => new Set(processed.map((s) => s.dayOfWeek)).size,
    [processed]
  );

  const semesters = program === "bsc" ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-8 pb-28 lg:pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Student View</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Select your program and semester to view your personalised class routine.
        </p>
      </motion.div>

      {/* Selectors */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-3d p-4 mb-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Program</label>
            <div className="grid grid-cols-2 gap-2">
              {(["bsc", "msc"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProgram(p);
                    setSemester("1");
                  }}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                    program === p
                      ? p === "bsc"
                        ? "border-transparent bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-glow"
                        : "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-glow"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {p === "bsc" ? "B.Sc. (8 Sem)" : "M.Sc. (3 Sem)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Semester</label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Classes" value={processed.length} icon={Layers} variant="teal" index={0} />
        <StatCard label="Active Days" value={dayCount} icon={CalendarDays} variant="amber" index={1} />
        <StatCard label="Semester" value={semester} icon={BookOpen} variant="emerald" index={2} />
        <StatCard label="Program" value={program.toUpperCase()} icon={GraduationCap} variant="cyan" index={3} />
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg">
            {program === "bsc" ? "B.Sc." : "M.Sc."} · Semester {semester}
          </h2>
          {TODAY_NAME && (
            <Badge variant="outline" className="text-[10px] h-5">
              Today: {TODAY_NAME}
            </Badge>
          )}
        </div>
        <ViewModeToggle value={viewMode} onChange={setViewMode} modes={["cards", "list", "timeline"]} />
      </div>

      {/* Views */}
      {isLoading ? (
        <LoadingState message="Loading your routine…" />
      ) : processed.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes found"
          message={`There are no active classes for ${program.toUpperCase()} Semester ${semester}. Try a different semester.`}
        />
      ) : viewMode === "cards" ? (
        <StudentCardsView schedules={processed} changeMap={changeMap} />
      ) : viewMode === "list" ? (
        <StudentListView schedules={processed} changeMap={changeMap} />
      ) : (
        <StudentTimelineView schedules={processed} changeMap={changeMap} />
      )}
    </div>
  );
}

type ProcessedSchedule = Schedule & {
  _moved?: boolean;
  _change?: NonNullable<ReturnType<typeof useRealtimeScheduleChanges>["data"]>[number];
  _cancelled?: boolean;
};

function StudentCardsView({
  schedules,
  changeMap,
}: {
  schedules: ProcessedSchedule[];
  changeMap: Map<string, NonNullable<ReturnType<typeof useRealtimeScheduleChanges>["data"]>[number]>;
}) {
  const grouped = useMemo(() => {
    const m = new Map<DayOfWeek, ProcessedSchedule[]>();
    for (const d of DAYS) m.set(d, []);
    for (const s of schedules) {
      const arr = m.get(s.dayOfWeek as DayOfWeek);
      if (arr) arr.push(s);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [schedules]);

  return (
    <div className="space-y-6">
      {DAYS.map((d, di) => {
        const items = grouped.get(d) ?? [];
        if (items.length === 0) return null;
        const isToday = d === TODAY_NAME;
        return (
          <motion.section
            key={d}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(di * 0.05, 0.3) }}
          >
            <div
              className={cn(
                "rounded-xl p-3 mb-3 flex items-center justify-between",
                isToday
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-glow"
                  : "bg-card border border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <h3 className={cn("font-bold", isToday ? "text-white" : "text-foreground")}>{d}</h3>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">
                    Today
                  </span>
                )}
              </div>
              <span className={cn("text-xs", isToday ? "text-white/90" : "text-muted-foreground")}>
                {items.length} {items.length === 1 ? "class" : "classes"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((s, i) => (
                <ScheduleCard key={s.id} schedule={s} change={changeMap.get(s.id) ?? (s as ProcessedSchedule)._change} index={i} />
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

function StudentListView({
  schedules,
}: {
  schedules: ProcessedSchedule[];
  changeMap: Map<string, NonNullable<ReturnType<typeof useRealtimeScheduleChanges>["data"]>[number]>;
}) {
  const sorted = useMemo(
    () =>
      [...schedules].sort(
        (a, b) =>
          DAYS.indexOf(a.dayOfWeek as DayOfWeek) - DAYS.indexOf(b.dayOfWeek as DayOfWeek) ||
          a.startTime.localeCompare(b.startTime)
      ),
    [schedules]
  );

  return (
    <div className="space-y-2">
      {sorted.map((s, i) => {
        const isLab = s.classType === "lab";
        const moved = (s as ProcessedSchedule)._moved;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.4) }}
            className="card-3d p-3 flex items-center gap-3"
          >
            <div
              className={cn(
                "flex flex-col items-center justify-center h-12 w-12 rounded-xl text-white shrink-0",
                isLab ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-teal-500 to-emerald-500"
              )}
            >
              {isLab ? <FlaskConical className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{s.courseCode}</span>
                <span className="text-xs text-muted-foreground">{s.courseName}</span>
                {moved && (
                  <Badge className="text-[9px] h-4 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                    Moved
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {s.dayOfWeek.slice(0, 3)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {s.startTime}–{s.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <User2 className="h-3 w-3" /> {s.teacherInitials}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> R-{s.roomNumber}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function StudentTimelineView({
  schedules,
}: {
  schedules: ProcessedSchedule[];
  changeMap: Map<string, NonNullable<ReturnType<typeof useRealtimeScheduleChanges>["data"]>[number]>;
}) {
  const grouped = useMemo(() => {
    const m = new Map<DayOfWeek, ProcessedSchedule[]>();
    for (const d of DAYS) m.set(d, []);
    for (const s of schedules) {
      const arr = m.get(s.dayOfWeek as DayOfWeek);
      if (arr) arr.push(s);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [schedules]);

  return (
    <div className="relative pl-6">
      {/* Vertical gradient line */}
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-500 via-emerald-500 to-amber-500 rounded-full" />

      <div className="space-y-6">
        {DAYS.map((d) => {
          const items = grouped.get(d) ?? [];
          if (items.length === 0) return null;
          const isToday = d === TODAY_NAME;
          return (
            <div key={d} className="relative">
              {/* Day marker */}
              <div
                className={cn(
                  "absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-background z-10",
                  isToday ? "bg-gradient-to-br from-teal-500 to-emerald-500" : "bg-primary"
                )}
              />
              <div className="flex items-center gap-2 mb-3 ml-2">
                <h3 className={cn("font-bold", isToday && "text-gradient-primary")}>{d}</h3>
                {isToday && (
                  <Badge className="text-[10px] h-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                    Today
                  </Badge>
                )}
              </div>
              <div className="space-y-2 ml-2">
                {items.map((s, i) => {
                  const isLab = s.classType === "lab";
                  const moved = (s as ProcessedSchedule)._moved;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      className="card-3d card-inner-glow p-3 relative"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-primary">{s.startTime}</p>
                          <p className="text-[10px] text-muted-foreground">{s.endTime}</p>
                        </div>
                        <div className="h-12 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold text-white",
                                isLab ? "bg-amber-500" : "bg-teal-500"
                              )}
                            >
                              {s.courseCode}
                            </span>
                            {moved && (
                              <Badge className="text-[9px] h-4 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                                Moved
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-sm mt-1 line-clamp-1">{s.courseName}</p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User2 className="h-3 w-3" /> {s.teacherInitials}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> R-{s.roomNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
