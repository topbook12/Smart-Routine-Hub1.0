"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Filter,
  Layers,
  MapPin,
  RotateCcw,
  User2,
  Users,
  X,
} from "lucide-react";
import {
  useRealtimeSchedules,
  useRealtimeTeachers,
  useRealtimeRooms,
  useRealtimeScheduleChanges,
} from "@/hooks/use-realtime-data";
import { DAYS, type Schedule, type DayOfWeek } from "@/types";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { StatCard, LoadingState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
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

export function MasterCalendarView() {
  const router = useRouter();
  const sp = useSearchParams();

  // Filters (initialised from URL)
  const [program, setProgram] = useState<string>(sp.get("program") || "all");
  const [semester, setSemester] = useState<string>(sp.get("semester") || "all");
  const [teacherId, setTeacherId] = useState<string>("all");
  const [roomId, setRoomId] = useState<string>("all");
  const [day, setDay] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const filters = { program, semester, teacherId, roomId, day };

  const { data: schedules, isLoading } = useRealtimeSchedules(filters);
  const { data: teachers } = useRealtimeTeachers();
  const { data: rooms } = useRealtimeRooms();
  const { data: changes } = useRealtimeScheduleChanges();

  // Sync program/semester back to URL (shallow)
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    params.delete("view"); // we re-add it below to avoid duplicates
    if (program !== "all") params.set("program", program);
    else params.delete("program");
    if (semester !== "all") params.set("semester", semester);
    else params.delete("semester");
    params.set("view", "master-calendar");
    const qs = params.toString();
    router.replace(`/?${qs}`, { scroll: false });
  }, [program, semester]);

  const changeMap = useMemo(() => {
    const m = new Map<string, (typeof changes)[number]>();
    changes?.forEach((c) => {
      if (c.scheduleId) m.set(c.scheduleId, c);
    });
    return m;
  }, [changes]);

  const resetFilters = () => {
    setProgram("all");
    setSemester("all");
    setTeacherId("all");
    setRoomId("all");
    setDay("all");
  };

  const activeFilters =
    (program !== "all" ? 1 : 0) +
    (semester !== "all" ? 1 : 0) +
    (teacherId !== "all" ? 1 : 0) +
    (roomId !== "all" ? 1 : 0) +
    (day !== "all" ? 1 : 0);

  // Derived stats
  const teacherCount = useMemo(
    () => new Set(schedules?.map((s) => s.teacherId)).size,
    [schedules]
  );
  const roomCount = useMemo(
    () => new Set(schedules?.map((s) => s.roomId)).size,
    [schedules]
  );
  const todayCount = useMemo(
    () => schedules?.filter((s) => s.dayOfWeek === TODAY_NAME).length ?? 0,
    [schedules]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-8 pb-28 lg:pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Master Routine</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Full departmental class schedule — {schedules?.length ?? 0} classes across {DAYS.length} days
            </p>
          </div>
          <ViewModeToggle value={viewMode} onChange={setViewMode} modes={["cards", "list", "grid"]} />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-3d p-3 sm:p-4 mb-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Smart Filters</span>
          {activeFilters > 0 && (
            <Badge className="h-5 text-[10px] bg-primary/15 text-primary border-primary/30">
              {activeFilters} active
            </Badge>
          )}
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 ml-auto text-xs gap-1">
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="bsc">BSc</SelectItem>
              <SelectItem value="msc">MSc</SelectItem>
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {program === "msc"
                ? [1, 2, 3].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)
                : [1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Room" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms?.map((r) => (
                <SelectItem key={r.id} value={r.id}>Room {r.roomNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Day" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Classes" value={schedules?.length ?? 0} icon={Layers} variant="teal" index={0} />
        <StatCard label="Today" value={todayCount} icon={Clock} variant="amber" index={1} />
        <StatCard label="Teachers" value={teacherCount} icon={Users} variant="emerald" index={2} />
        <StatCard label="Rooms" value={roomCount} icon={MapPin} variant="cyan" index={3} />
      </div>

      {/* Views */}
      {isLoading ? (
        <LoadingState message="Fetching live schedule…" />
      ) : !schedules || schedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes match your filters"
          message="Try adjusting or resetting the filters to see the full routine."
        />
      ) : viewMode === "cards" ? (
        <CardsView schedules={schedules} changeMap={changeMap} />
      ) : viewMode === "list" ? (
        <ListView schedules={schedules} changeMap={changeMap} />
      ) : (
        <GridView schedules={schedules} changeMap={changeMap} />
      )}
    </div>
  );
}

function CardsView({
  schedules,
  changeMap,
}: {
  schedules: Schedule[];
  changeMap: Map<string, Schedule["id"] extends never ? never : NonNullable<ReturnType<typeof useRealtimeScheduleChanges>["data"]>[number]>;
}) {
  const grouped = useMemo(() => {
    const m = new Map<DayOfWeek, Schedule[]>();
    for (const d of DAYS) m.set(d, []);
    for (const s of schedules) {
      const arr = m.get(s.dayOfWeek as DayOfWeek);
      if (arr) arr.push(s);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
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
            <div className="flex items-center gap-2 mb-3">
              <h3 className={cn("font-bold text-lg", isToday && "text-gradient-primary")}>{d}</h3>
              {isToday && (
                <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] h-5">
                  Today
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5">{items.length} classes</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((s, i) => (
                <ScheduleCard key={s.id} schedule={s} change={changeMap.get(s.id)} index={i} />
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

function ListView({
  schedules,
  changeMap,
}: {
  schedules: Schedule[];
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
    <div className="card-3d overflow-hidden">
      {/* Header (desktop) */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold border-b">
        <div className="col-span-2">Day</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-2">Course</div>
        <div className="col-span-3">Title</div>
        <div className="col-span-2">Teacher</div>
        <div className="col-span-1">Room</div>
      </div>
      <div className="divide-y divide-border/60">
        {sorted.map((s, i) => {
          const change = changeMap.get(s.id);
          const isCancelled = change?.changeType === "cancelled";
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              className={cn(
                "grid grid-cols-12 gap-2 px-4 py-2.5 text-xs items-center hover:bg-accent/40 transition-colors",
                isCancelled && "opacity-50"
              )}
            >
              <div className="col-span-4 sm:col-span-2 font-medium">
                {s.dayOfWeek.slice(0, 3)}
                {s.dayOfWeek === TODAY_NAME && (
                  <span className="ml-1 text-[9px] text-primary font-bold">TODAY</span>
                )}
              </div>
              <div className="col-span-8 sm:col-span-2 text-muted-foreground order-3 sm:order-none">
                {s.startTime}–{s.endTime}
              </div>
              <div className="col-span-4 sm:col-span-2">
                <span
                  className={cn(
                    "inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold text-white",
                    s.classType === "lab" ? "bg-amber-500" : "bg-teal-500"
                  )}
                >
                  {s.courseCode}
                </span>
              </div>
              <div className="col-span-8 sm:col-span-3 truncate font-medium">{s.courseName}</div>
              <div className="col-span-6 sm:col-span-2 text-muted-foreground truncate">
                {s.teacherInitials ?? s.teacherName}
              </div>
              <div className="col-span-6 sm:col-span-1 text-muted-foreground">{s.roomNumber}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GridView({
  schedules,
  changeMap,
}: {
  schedules: Schedule[];
  changeMap: Map<string, NonNullable<ReturnType<typeof useRealtimeScheduleChanges>["data"]>[number]>;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Group by day → time slot
  const grid = useMemo(() => {
    const m = new Map<string, Map<string, Schedule[]>>(); // day -> timeLabel -> items
    for (const d of DAYS) m.set(d, new Map());
    for (const s of schedules) {
      const dayMap = m.get(s.dayOfWeek as DayOfWeek);
      if (!dayMap) continue;
      const key = `${s.startTime}-${s.endTime}`;
      const arr = dayMap.get(key) ?? [];
      arr.push(s);
      dayMap.set(key, arr);
    }
    return m;
  }, [schedules]);

  const timeSlots = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => set.add(`${s.startTime}-${s.endTime}`));
    return Array.from(set).sort();
  }, [schedules]);

  const todayLabel = weekOffset === 0 ? "Today" : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`;

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 card-3d p-3">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)} className="gap-1">
          ← Prev
        </Button>
        <div className="text-center">
          <p className="font-semibold text-sm">Weekly Grid</p>
          <p className="text-[11px] text-muted-foreground">
            {weekOffset === 0 ? "Current week" : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? "s" : ""} ${weekOffset > 0 ? "ahead" : "back"}`}
          </p>
        </div>
        <div className="flex gap-1.5">
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-xs">
              {todayLabel}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)} className="gap-1">
            Next →
          </Button>
        </div>
      </div>

      <div className="card-3d overflow-x-auto scrollbar-premium">
        <div className="min-w-[900px]">
          {/* Header row */}
          <div className="grid grid-cols-[120px_repeat(6,1fr)] border-b bg-muted/40">
            <div className="px-3 py-2.5 text-[11px] uppercase font-semibold text-muted-foreground border-r">
              Time
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                className={cn(
                  "px-3 py-2.5 text-xs font-semibold border-r text-center",
                  d === TODAY_NAME && "bg-primary/10 text-primary"
                )}
              >
                {d.slice(0, 3)}
                {d === TODAY_NAME && (
                  <span className="block text-[9px] text-primary font-bold">TODAY</span>
                )}
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {timeSlots.map((slot) => {
            const [start, end] = slot.split("-");
            return (
              <div key={slot} className="grid grid-cols-[120px_repeat(6,1fr)] border-b last:border-0 min-h-[80px]">
                <div className="px-3 py-2 text-[11px] text-muted-foreground border-r bg-muted/20 flex flex-col justify-center">
                  <span className="font-medium text-foreground">{start}</span>
                  <span>{end}</span>
                </div>
                {DAYS.map((d) => {
                  const items = grid.get(d)?.get(slot) ?? [];
                  return (
                    <div key={d} className="border-r p-1.5 space-y-1.5">
                      {items.map((s) => {
                        const change = changeMap.get(s.id);
                        const isLab = s.classType === "lab";
                        const isCancelled = change?.changeType === "cancelled";
                        return (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              "rounded-lg p-2 text-white text-[10px] leading-tight",
                              isLab
                                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                                : "bg-gradient-to-br from-teal-500 to-emerald-500",
                              isCancelled && "opacity-40 line-through"
                            )}
                          >
                            <div className="font-bold">{s.courseCode}</div>
                            <div className="opacity-90 line-clamp-1">{s.teacherInitials}</div>
                            <div className="opacity-80">R-{s.roomNumber}</div>
                            <div className="opacity-70 text-[9px]">Sem {s.semester} · {s.program}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {timeSlots.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No time slots for current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
