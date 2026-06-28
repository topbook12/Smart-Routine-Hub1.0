"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Layers,
  RotateCcw,
  FlaskConical,
  Clock,
  MapPin,
} from "lucide-react";
import {
  useRealtimeSchedules,
  useRealtimeScheduleChanges,
  useRealtimeRooms,
} from "@/hooks/use-realtime-data";
import { DAYS, type DayOfWeek, type Schedule, type ScheduleChange } from "@/types";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { StatCard, LoadingState, EmptyState } from "@/components/shared/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { ClassActionDialog } from "@/components/teacher/class-action-dialog";

type Processed = Schedule & {
  _moved?: boolean;
  _change?: ScheduleChange;
  _cancelled?: boolean;
};

interface Props {
  teacherId: string;
}

export function MyScheduleTab({ teacherId }: Props) {
  const today = useToday();
  const [semester, setSemester] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");
  const [roomId, setRoomId] = useState<string>("all");
  const [day, setDay] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [actionSchedule, setActionSchedule] = useState<Schedule | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  const filters = {
    teacherId,
    ...(semester !== "all" && { semester: Number(semester) }),
    ...(program !== "all" && { program }),
    ...(roomId !== "all" && { roomId }),
    ...(day !== "all" && { day }),
  };

  const { data: schedules, isLoading } = useRealtimeSchedules(filters);
  const { data: changes } = useRealtimeScheduleChanges({ teacherId });
  const { data: rooms } = useRealtimeRooms();

  const changeMap = useMemo(() => {
    // Changes are sorted by createdAt desc — keep only the most recent per scheduleId
    const m = new Map<string, ScheduleChange>();
    changes?.forEach((c) => {
      if (c.scheduleId && !m.has(c.scheduleId)) m.set(c.scheduleId, c);
    });
    return m;
  }, [changes]);

  // Apply changes: filter cancelled, override rescheduled/room_changed
  const processed = useMemo<Processed[]>(() => {
    if (!schedules) return [];
    return schedules
      .map((s) => {
        const change = changeMap.get(s.id);
        if (change?.changeType === "cancelled") {
          return { ...s, _cancelled: true, _change: change } as Processed;
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
          } as Processed;
        }
        if (change?.changeType === "room_changed") {
          return {
            ...s,
            roomNumber: change.newRoomNumber ?? s.roomNumber,
            _change: change,
          } as Processed;
        }
        return s as Processed;
      })
      .filter((s) => !s._cancelled);
  }, [schedules, changeMap]);

  const todayCount = useMemo(
    () => processed.filter((s) => s.dayOfWeek === today).length,
    [processed, today]
  );
  const distinctCourses = useMemo(
    () => new Set(processed.map((s) => s.courseCode)).size,
    [processed]
  );
  const activeDays = useMemo(
    () => new Set(processed.map((s) => s.dayOfWeek)).size,
    [processed]
  );

  const reset = () => {
    setSemester("all");
    setProgram("all");
    setRoomId("all");
    setDay("all");
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-4"
      >
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <FilterSelect
            label="Semester"
            value={semester}
            onChange={setSemester}
            options={[
              { value: "all", label: "All Semesters" },
              ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                value: String(s),
                label: `Sem ${s}`,
              })),
            ]}
          />
          <FilterSelect
            label="Program"
            value={program}
            onChange={setProgram}
            options={[
              { value: "all", label: "All Programs" },
              { value: "bsc", label: "B.Sc." },
              { value: "msc", label: "M.Sc." },
            ]}
          />
          <FilterSelect
            label="Room"
            value={roomId}
            onChange={setRoomId}
            options={[
              { value: "all", label: "All Rooms" },
              ...(rooms ?? []).map((r) => ({
                value: r.id,
                label: `Room ${r.roomNumber}`,
              })),
            ]}
          />
          <FilterSelect
            label="Day"
            value={day}
            onChange={setDay}
            options={[
              { value: "all", label: "All Days" },
              ...DAYS.map((d) => ({ value: d, label: d })),
            ]}
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-muted-foreground mb-1.5">
              Actions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="h-9 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Classes"
          value={processed.length}
          icon={Layers}
          variant="teal"
          index={0}
        />
        <StatCard
          label="Today"
          value={todayCount}
          icon={CalendarDays}
          variant="amber"
          index={1}
        />
        <StatCard
          label="Active Days"
          value={activeDays}
          icon={CalendarRange}
          variant="emerald"
          index={2}
        />
        <StatCard
          label="Courses"
          value={distinctCourses}
          icon={BookOpen}
          variant="cyan"
          index={3}
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg sm:text-xl">My Weekly Routine</h2>
          <Badge variant="outline" className="text-[10px] h-5">
            Today: {today ? today.slice(0, 3) : "—"}
          </Badge>
        </div>
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          modes={["cards", "list"]}
        />
      </div>

      {/* Views */}
      {isLoading ? (
        <LoadingState message="Loading your schedule…" />
      ) : processed.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No classes found"
          message="You have no scheduled classes matching these filters. Try adjusting the filters above."
        />
      ) : viewMode === "cards" ? (
        <CardsView
          schedules={processed}
          changeMap={changeMap}
          today={today}
          onCardClick={(s) => {
            setActionSchedule(s);
            setActionOpen(true);
          }}
        />
      ) : (
        <ListView schedules={processed} />
      )}

      {/* Class Action Dialog — opens when teacher clicks a class */}
      <ClassActionDialog
        schedule={actionSchedule}
        open={actionOpen}
        onOpenChange={setActionOpen}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-muted-foreground mb-1.5">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CardsView({
  schedules,
  changeMap,
  today,
  onCardClick,
}: {
  schedules: Processed[];
  changeMap: Map<string, ScheduleChange>;
  today: DayOfWeek | null;
  onCardClick?: (s: Schedule) => void;
}) {
  const grouped = useMemo(() => {
    const m = new Map<DayOfWeek, Processed[]>();
    for (const d of DAYS) m.set(d, []);
    for (const s of schedules) {
      const arr = m.get(s.dayOfWeek as DayOfWeek);
      if (arr) arr.push(s);
    }
    for (const arr of m.values())
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [schedules]);

  return (
    <div className="space-y-6">
      {DAYS.map((d, di) => {
        const items = grouped.get(d) ?? [];
        if (items.length === 0) return null;
        const isToday = d === today;
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
                <h3
                  className={cn(
                    "font-bold",
                    isToday ? "text-white" : "text-foreground"
                  )}
                >
                  {d}
                </h3>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">
                    Today
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isToday ? "text-white/90" : "text-muted-foreground"
                )}
              >
                {items.length} {items.length === 1 ? "class" : "classes"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => onCardClick?.(s)}
                  className={cn(onCardClick && "cursor-pointer")}
                >
                  <ScheduleCard
                    schedule={s}
                    change={changeMap.get(s.id) ?? s._change}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

function ListView({ schedules }: { schedules: Processed[] }) {
  const sorted = useMemo(
    () =>
      [...schedules].sort(
        (a, b) =>
          DAYS.indexOf(a.dayOfWeek as DayOfWeek) -
            DAYS.indexOf(b.dayOfWeek as DayOfWeek) ||
          a.startTime.localeCompare(b.startTime)
      ),
    [schedules]
  );

  return (
    <div className="space-y-2">
      {sorted.map((s, i) => {
        const isLab = s.classType === "lab";
        const moved = s._moved;
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
                isLab
                  ? "bg-gradient-to-br from-amber-500 to-orange-500"
                  : "bg-gradient-to-br from-teal-500 to-emerald-500"
              )}
            >
              {isLab ? (
                <FlaskConical className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{s.courseCode}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {s.courseName}
                </span>
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
                  <MapPin className="h-3 w-3" /> R-{s.roomNumber}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-muted/60 uppercase font-medium">
                  {s.program} · Sem {s.semester}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
