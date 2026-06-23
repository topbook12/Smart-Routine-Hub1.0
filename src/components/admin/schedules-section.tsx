"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Filter, MapPin, Pencil, Plus, RotateCcw, Trash2, User2 } from "lucide-react";
import { useRealtimeSchedules, useRealtimeTeachers, useRealtimeCourses, useRealtimeRooms, useRealtimeTimeSlots } from "@/hooks/use-realtime-data";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { SectionHeader } from "@/components/admin/section-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DAYS, type DayOfWeek } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SchedForm {
  id?: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  semester: number;
  program: "bsc" | "msc";
  classType: "theory" | "lab";
}

const EMPTY: SchedForm = {
  courseId: "",
  teacherId: "",
  roomId: "",
  timeSlotId: "",
  startTime: "09:30 AM",
  endTime: "10:30 AM",
  dayOfWeek: "Saturday",
  semester: 1,
  program: "bsc",
  classType: "theory",
};

export function SchedulesSection() {
  const [filters, setFilters] = useState({ program: "all", semester: "all", day: "all", teacherId: "all" });
  const { data: schedules, isLoading } = useRealtimeSchedules({
    program: filters.program !== "all" ? filters.program : undefined,
    semester: filters.semester !== "all" ? filters.semester : undefined,
    day: filters.day !== "all" ? filters.day : undefined,
    teacherId: filters.teacherId !== "all" ? filters.teacherId : undefined,
  });
  const { data: teachers } = useRealtimeTeachers();
  const { data: courses } = useRealtimeCourses();
  const { data: rooms } = useRealtimeRooms();
  const { data: timeSlots } = useRealtimeTimeSlots();
  const mutation = useAdminMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<SchedForm>(EMPTY);

  const courseById = useMemo(() => new Map(courses?.map((c) => [c.id, c])), [courses]);
  const teacherById = useMemo(() => new Map(teachers?.map((t) => [t.id, t])), [teachers]);
  const roomById = useMemo(() => new Map(rooms?.map((r) => [r.id, r])), [rooms]);

  const openAdd = () => { setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (s: typeof schedules[number]) => {
    setForm({
      id: s.id,
      courseId: s.courseId,
      teacherId: s.teacherId,
      roomId: s.roomId,
      timeSlotId: s.timeSlotId || "",
      startTime: s.startTime,
      endTime: s.endTime,
      dayOfWeek: s.dayOfWeek as DayOfWeek,
      semester: s.semester,
      program: s.program as "bsc" | "msc",
      classType: s.classType as "theory" | "lab",
    });
    setDialogOpen(true);
  };

  // Auto-fill when course/teacher/room selected
  const onSelectCourse = (cid: string) => {
    const c = courseById.get(cid);
    if (c) {
      setForm((f) => ({ ...f, courseId: cid, courseName: c.name, courseCode: c.code, classType: c.type, semester: c.semester, program: c.program }));
    } else {
      setForm((f) => ({ ...f, courseId: cid }));
    }
  };
  const onSelectTeacher = (tid: string) => {
    const t = teacherById.get(tid);
    setForm((f) => ({ ...f, teacherId: tid, teacherName: t?.fullName || "" }));
  };
  const onSelectRoom = (rid: string) => {
    const r = roomById.get(rid);
    setForm((f) => ({ ...f, roomId: rid, roomNumber: r?.roomNumber || "" }));
  };
  const onSelectSlot = (slotId: string) => {
    const slot = timeSlots?.find((s) => s.id === slotId);
    if (slot) {
      setForm((f) => ({ ...f, timeSlotId: slotId, startTime: slot.startTime, endTime: slot.endTime }));
    }
  };

  const save = () => {
    if (!form.courseId || !form.teacherId || !form.roomId) {
      toast.error("Course, teacher and room are required");
      return;
    }
    const c = courseById.get(form.courseId);
    const t = teacherById.get(form.teacherId);
    const r = roomById.get(form.roomId);
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      courseId: form.courseId,
      teacherId: form.teacherId,
      roomId: form.roomId,
      timeSlotId: form.timeSlotId || null,
      courseName: c?.name || "",
      courseCode: c?.code || "",
      teacherName: t?.fullName || "",
      roomNumber: r?.roomNumber || "",
      startTime: form.startTime,
      endTime: form.endTime,
      dayOfWeek: form.dayOfWeek,
      semester: form.semester,
      program: form.program,
      classType: form.classType,
      isActive: true,
    };
    mutation.mutate({
      method: form.id ? "PUT" : "POST",
      url: "/api/schedules",
      body: payload,
      successMsg: form.id ? "Schedule updated" : "Schedule added",
    }, { onSettled: () => setDialogOpen(false) });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate({ method: "DELETE", url: `/api/schedules?id=${deleteId}`, successMsg: "Schedule removed" }, {
      onSettled: () => setDeleteId(null),
    });
  };

  const resetFilters = () => setFilters({ program: "all", semester: "all", day: "all", teacherId: "all" });
  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  const sorted = useMemo(
    () =>
      [...(schedules ?? [])].sort(
        (a, b) =>
          DAYS.indexOf(a.dayOfWeek as DayOfWeek) - DAYS.indexOf(b.dayOfWeek as DayOfWeek) ||
          a.startTime.localeCompare(b.startTime)
      ),
    [schedules]
  );

  return (
    <div>
      <SectionHeader
        title="Schedules"
        description="Full CRUD for every class slot across all programs and semesters."
        icon={CalendarDays}
        badge={schedules?.length ?? 0}
        action={
          <Button onClick={openAdd} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Class
          </Button>
        }
      />

      {/* Filters */}
      <div className="card-3d p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Filters</span>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 ml-auto text-xs gap-1">
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select value={filters.program} onValueChange={(v) => setFilters({ ...filters, program: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="bsc">BSc</SelectItem>
              <SelectItem value="msc">MSc</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.semester} onValueChange={(v) => setFilters({ ...filters, semester: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sem</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.day} onValueChange={(v) => setFilters({ ...filters, day: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Day" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.teacherId} onValueChange={(v) => setFilters({ ...filters, teacherId: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers?.map((t) => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading schedules…" />
      ) : sorted.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No schedules" message="Add a class or adjust filters." />
      ) : (
        <div className="card-3d overflow-x-auto scrollbar-premium">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold">Day</th>
                <th className="text-left px-3 py-2.5 font-semibold">Time</th>
                <th className="text-left px-3 py-2.5 font-semibold">Code</th>
                <th className="text-left px-3 py-2.5 font-semibold hidden md:table-cell">Title</th>
                <th className="text-left px-3 py-2.5 font-semibold hidden lg:table-cell">Teacher</th>
                <th className="text-left px-3 py-2.5 font-semibold">Room</th>
                <th className="text-right px-3 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sorted.slice(0, 200).map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  className="hover:bg-accent/40"
                >
                  <td className="px-3 py-2 font-medium text-xs">{s.dayOfWeek.slice(0, 3)}</td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{s.startTime}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold text-white",
                      s.classType === "lab" ? "bg-amber-500" : "bg-teal-500")}>
                      {s.courseCode}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs hidden md:table-cell truncate max-w-[180px]">{s.courseName}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[140px]">{s.teacherInitials}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.roomNumber}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-7 w-7 p-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)} className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {sorted.length > 200 && (
            <p className="text-xs text-muted-foreground text-center py-3 border-t">
              Showing first 200 of {sorted.length} schedules. Refine filters to narrow down.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-premium">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Class" : "Add Class"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Course *</Label>
              <Select value={form.courseId} onValueChange={onSelectCourse}>
                <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Teacher *</Label>
              <Select value={form.teacherId} onValueChange={onSelectTeacher}>
                <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Room *</Label>
              <Select value={form.roomId} onValueChange={onSelectRoom}>
                <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {rooms?.map((r) => <SelectItem key={r.id} value={r.id}>{r.roomNumber} ({r.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Day</Label>
                <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v as DayOfWeek })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Time Slot (optional)</Label>
                <Select value={form.timeSlotId} onValueChange={onSelectSlot}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Manual" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots?.map((s) => <SelectItem key={s.id} value={s.id}>{s.startTime} – {s.endTime}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="mt-1 h-10" placeholder="09:30 AM" />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="mt-1 h-10" placeholder="10:30 AM" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Program</Label>
                <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v as "bsc" | "msc" })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Semester</Label>
                <Select value={String(form.semester)} onValueChange={(v) => setForm({ ...form, semester: Number(v) })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {form.program === "msc"
                      ? [1, 2, 3].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)
                      : [1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.classType} onValueChange={(v) => setForm({ ...form, classType: v as "theory" | "lab" })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={mutation.isPending} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>This schedule slot will be removed permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
