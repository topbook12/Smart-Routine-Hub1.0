"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  MapPin,
  Hash,
  Search,
  Filter,
  RotateCcw,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import {
  useRealtimeSchedules,
  useRealtimeTeachers,
  useRealtimeCourses,
  useRealtimeRooms,
  useRealtimeTimeSlots,
} from "@/hooks/use-realtime-data";
import {
  SectionHeader,
  SectionShell,
  AddButton,
  RowActions,
  ConfirmDelete,
  SubmitButton,
  Field,
  LoadingState,
  EmptyState,
  TypeBadge,
} from "../shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DAYS,
  semesterLabel,
  type Schedule,
  type Course,
  type Program,
  type ClassType,
  type DayOfWeek,
  type User as UserType,
  type Room,
  type TimeSlot,
} from "@/types";

interface FormState {
  id?: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  semester: number;
  program: Program;
  classType: ClassType;
  section: string;
  // Denormalized snapshot fields (auto-filled)
  courseName: string;
  courseCode: string;
  teacherName: string;
  teacherInitials: string;
  roomNumber: string;
}

const EMPTY_FORM: FormState = {
  courseId: "",
  teacherId: "",
  roomId: "",
  timeSlotId: "",
  startTime: "08:30",
  endTime: "10:00",
  dayOfWeek: "Saturday",
  semester: 1,
  program: "bsc",
  classType: "theory",
  section: "",
  courseName: "",
  courseCode: "",
  teacherName: "",
  teacherInitials: "",
  roomNumber: "",
};

const DAY_BADGE: Record<string, string> = {
  Saturday: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  Sunday: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  Monday: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Tuesday: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Wednesday: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Thursday: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  Friday: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SchedulesSection({ autoOpenAddSignal }: { autoOpenAddSignal?: number }) {
  const [filters, setFilters] = React.useState<{
    program: "all" | Program;
    semester: "all" | number;
    day: "all" | DayOfWeek;
    teacherId: "all" | string;
  }>({
    program: "all",
    semester: "all",
    day: "all",
    teacherId: "all",
  });
  const [search, setSearch] = React.useState("");

  const { data: schedules, isLoading } = useRealtimeSchedules({
    program: filters.program === "all" ? undefined : filters.program,
    semester: filters.semester === "all" ? undefined : filters.semester,
    day: filters.day === "all" ? undefined : filters.day,
    teacherId: filters.teacherId === "all" ? undefined : filters.teacherId,
  });
  const { data: teachers } = useRealtimeTeachers();
  const { data: courses } = useRealtimeCourses();
  const { data: rooms } = useRealtimeRooms();
  const { data: timeSlots } = useRealtimeTimeSlots();

  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (autoOpenAddSignal && autoOpenAddSignal > 0) {
      setForm(EMPTY_FORM);
      setIsEdit(false);
      setDialogOpen(true);
    }
  }, [autoOpenAddSignal]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setForm({
      id: s.id,
      courseId: s.courseId,
      teacherId: s.teacherId,
      roomId: s.roomId,
      timeSlotId: s.timeSlotId || "",
      startTime: s.startTime,
      endTime: s.endTime,
      dayOfWeek: s.dayOfWeek,
      semester: s.semester,
      program: s.program,
      classType: s.classType,
      section: s.section || "",
      courseName: s.courseName,
      courseCode: s.courseCode,
      teacherName: s.teacherName,
      teacherInitials: s.teacherInitials || "",
      roomNumber: s.roomNumber,
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const body = {
        ...data,
        semester: Number(data.semester),
        timeSlotId: data.timeSlotId || null,
        section: data.section || null,
        teacherInitials: data.teacherInitials || null,
      };
      if (isEdit) {
        const { id, ...rest } = body;
        const res = await fetch("/api/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...rest }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
        return res.json();
      } else {
        const { id: _id, ...rest } = body as FormState & { id?: string };
        void _id;
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Schedule updated" : "Schedule added");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Schedule deleted");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-fill handlers
  const onCourseChange = (courseId: string) => {
    const c = (courses || []).find((x) => x.id === courseId) as Course | undefined;
    setForm((f) => ({
      ...f,
      courseId,
      courseName: c?.name || "",
      courseCode: c?.code || "",
      classType: c?.type || "theory",
      semester: c?.semester || f.semester,
      program: c?.program || f.program,
    }));
  };

  const onTeacherChange = (teacherId: string) => {
    const t = (teachers || []).find((x) => x.id === teacherId) as UserType | undefined;
    setForm((f) => ({
      ...f,
      teacherId,
      teacherName: t?.fullName || "",
      teacherInitials: t ? getInitials(t.fullName) : "",
    }));
  };

  const onRoomChange = (roomId: string) => {
    const r = (rooms || []).find((x) => x.id === roomId) as Room | undefined;
    setForm((f) => ({
      ...f,
      roomId,
      roomNumber: r?.roomNumber || "",
    }));
  };

  const onTimeSlotChange = (timeSlotId: string) => {
    const ts = (timeSlots || []).find((x) => x.id === timeSlotId) as TimeSlot | undefined;
    setForm((f) => ({
      ...f,
      timeSlotId,
      startTime: ts?.startTime || f.startTime,
      endTime: ts?.endTime || f.endTime,
    }));
  };

  const filtered = React.useMemo(() => {
    if (!schedules) return [];
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter(
      (s) =>
        s.courseName.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) ||
        s.teacherName.toLowerCase().includes(q) ||
        s.roomNumber.toLowerCase().includes(q)
    );
  }, [schedules, search]);

  const resetFilters = () =>
    setFilters({ program: "all", semester: "all", day: "all", teacherId: "all" });

  const hasActiveFilters =
    filters.program !== "all" ||
    filters.semester !== "all" ||
    filters.day !== "all" ||
    filters.teacherId !== "all";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.teacherId || !form.roomId) {
      toast.error("Course, teacher, and room are required");
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error("Start and end times are required");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Schedules"
        description="Manage all class routines across programs and semesters"
        icon={CalendarDays}
        action={<AddButton onClick={openCreate} label="Add Schedule" icon={Plus} />}
      />

      {/* Filters */}
      <div className="card-3d card-inner-glow p-3 sm:p-4">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Smart Filters
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Select
              value={filters.program}
              onValueChange={(v) => setFilters((f) => ({ ...f, program: v as "all" | Program }))}
            >
              <SelectTrigger className="w-full bg-card/60 h-9">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="bsc">BSc</SelectItem>
                <SelectItem value="msc">MSc</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(filters.semester)}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, semester: v === "all" ? "all" : Number(v) }))
              }
            >
              <SelectTrigger className="w-full bg-card/60 h-9">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {semesterLabel(s)} Semester
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.day}
              onValueChange={(v) => setFilters((f) => ({ ...f, day: v as "all" | DayOfWeek }))}
            >
              <SelectTrigger className="w-full bg-card/60 h-9">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.teacherId}
              onValueChange={(v) => setFilters((f) => ({ ...f, teacherId: v }))}
            >
              <SelectTrigger className="w-full bg-card/60 h-9">
                <SelectValue placeholder="Teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {(teachers || []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/60">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course, teacher, room…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {schedules && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {filtered.length}/{schedules.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading schedules…" />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No schedules found"
          message={hasActiveFilters || search ? "Try adjusting filters or search." : "Add your first schedule to get started."}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block card-3d card-inner-glow overflow-hidden">
            <div className="relative z-10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="pl-4">Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.4) }}
                      className="hover:bg-muted/50 border-b transition-colors"
                    >
                      <TableCell className="pl-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${DAY_BADGE[s.dayOfWeek] ?? DAY_BADGE.Friday}`}>
                          {s.dayOfWeek.slice(0, 3)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" />
                          {s.startTime}–{s.endTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500">
                              {s.classType === "lab" ? <FlaskConical className="h-2.5 w-2.5" /> : <BookOpen className="h-2.5 w-2.5" />}
                              {s.courseCode}
                            </span>
                            <TypeBadge type={s.classType} />
                          </div>
                          <div className="text-xs truncate mt-0.5">{s.courseName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {s.program.toUpperCase()} · Sem {s.semester}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[180px]">
                          <div className="text-xs font-medium truncate">{s.teacherName}</div>
                          {s.teacherInitials && (
                            <div className="text-[10px] text-muted-foreground font-mono">{s.teacherInitials}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {s.roomNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{s.section || "—"}</span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <RowActions onEdit={() => openEdit(s)} onDelete={() => setDeleteId(s.id)} />
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid grid-cols-1 gap-2">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="card-3d card-inner-glow overflow-hidden"
              >
                <div className={`h-1 ${s.classType === "lab" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-teal-500 to-emerald-500"}`} />
                <div className="relative z-10 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${DAY_BADGE[s.dayOfWeek] ?? DAY_BADGE.Friday}`}>
                          {s.dayOfWeek}
                        </span>
                        <span className="text-[10px] font-mono inline-flex items-center gap-0.5 text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" /> {s.startTime}–{s.endTime}
                        </span>
                        <TypeBadge type={s.classType} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500">
                          {s.courseCode}
                        </span>
                        <span className="text-xs font-semibold truncate">{s.courseName}</span>
                      </div>
                    </div>
                    <RowActions onEdit={() => openEdit(s)} onDelete={() => setDeleteId(s.id)} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 truncate">
                      <User className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{s.teacherInitials || s.teacherName.split(" ").slice(-1)[0]}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      {s.roomNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <Hash className="h-3 w-3 text-primary shrink-0" />
                      {s.program.toUpperCase()}·{s.semester}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {isEdit ? "Edit Schedule" : "Add New Schedule"}
            </DialogTitle>
            <DialogDescription>
              Selecting course/teacher/room will auto-fill the snapshot fields. You can override times manually.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Course" required>
                <Select value={form.courseId} onValueChange={onCourseChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses || []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.name} ({c.program.toUpperCase()} {c.semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Teacher" required>
                <Select value={form.teacherId} onValueChange={onTeacherChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teachers || []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.fullName} {t.designation ? `(${t.designation})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Room" required>
                <Select value={form.roomId} onValueChange={onRoomChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rooms || []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.roomNumber} · {r.type} ({r.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Time Slot (preset)" hint="Optional — pick a standard slot or set times manually">
                <Select value={form.timeSlotId} onValueChange={onTimeSlotChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick preset (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(timeSlots || []).map((ts) => (
                      <SelectItem key={ts.id} value={ts.id}>
                        {ts.label} · {ts.startTime}–{ts.endTime}
                        {ts.isBreak ? " (break)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time" required>
                <Input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </Field>
              <Field label="End Time" required>
                <Input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Day of Week" required>
                <Select
                  value={form.dayOfWeek}
                  onValueChange={(v) => setForm({ ...form, dayOfWeek: v as DayOfWeek })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Section" hint="Optional section identifier (e.g. A, B)">
                <Input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="e.g. A"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Program" required>
                <Select
                  value={form.program}
                  onValueChange={(v) => setForm({ ...form, program: v as Program })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Semester" required>
                <Select
                  value={String(form.semester)}
                  onValueChange={(v) => setForm({ ...form, semester: Number(v) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {semesterLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Class Type" required>
                <Select
                  value={form.classType}
                  onValueChange={(v) => setForm({ ...form, classType: v as ClassType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Auto-filled preview */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border border-teal-500/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Auto-filled snapshot
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <div className="text-muted-foreground">Course Code</div>
                  <div className="font-mono font-semibold text-primary">{form.courseCode || "—"}</div>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <div className="text-muted-foreground">Course Name</div>
                  <div className="font-medium truncate">{form.courseName || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Room #</div>
                  <div className="font-medium">{form.roomNumber || "—"}</div>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <div className="text-muted-foreground">Teacher</div>
                  <div className="font-medium truncate">
                    {form.teacherInitials && <Badge variant="outline" className="text-[10px] mr-1.5 font-mono">{form.teacherInitials}</Badge>}
                    {form.teacherName || "—"}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <SubmitButton loading={mutation.isPending}>
                {isEdit ? "Save Changes" : "Create Schedule"}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete schedule?"
        description="This permanently removes the class from the routine. Schedule changes referencing this class will remain."
      />
    </SectionShell>
  );
}
