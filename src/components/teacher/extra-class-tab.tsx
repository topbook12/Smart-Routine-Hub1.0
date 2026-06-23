"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  CalendarPlus,
  FlaskConical,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  useRealtimeCourses,
  useRealtimeTimeSlots,
} from "@/hooks/use-realtime-data";
import { DAYS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RoomWithAvail = {
  id: string;
  roomNumber: string;
  building?: string | null;
  type: string;
  capacity: number;
  isActive: boolean;
  available?: boolean;
};

interface Props {
  teacherId: string;
  teacherName: string;
}

export function ExtraClassTab({ teacherId, teacherName }: Props) {
  const queryClient = useQueryClient();
  const { data: courses } = useRealtimeCourses();
  const { data: timeSlots } = useRealtimeTimeSlots();

  const [courseId, setCourseId] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const selectedCourse = useMemo(
    () => courses?.find((c) => c.id === courseId),
    [courses, courseId]
  );

  // Derive class type / program / semester from the selected course
  const classType = selectedCourse?.type ?? "theory";
  const program = selectedCourse?.program ?? "bsc";
  const semester = selectedCourse?.semester ?? 1;

  // When a lab course is selected, only show lab rooms
  const roomTypeFilter = classType === "lab" ? "lab" : undefined;

  const canQueryRooms = !!(day && startTime && endTime);
  const { data: roomsWithAvail, isLoading: roomsLoading } = useQuery<RoomWithAvail[]>({
    queryKey: ["available-rooms-extra", day, startTime, endTime, roomTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        day,
        startTime,
        endTime,
      });
      if (roomTypeFilter) params.set("type", roomTypeFilter);
      const res = await fetch(`/api/rooms?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load rooms");
      return res.json();
    },
    enabled: canQueryRooms,
    staleTime: 10_000,
  });

  const availableRooms = useMemo(
    () => (roomsWithAvail ?? []).filter((r) => r.available !== false),
    [roomsWithAvail]
  );
  const bookedCount = (roomsWithAvail ?? []).length - availableRooms.length;

  const selectedRoom = useMemo(
    () => (roomsWithAvail ?? []).find((r) => r.id === roomId),
    [roomsWithAvail, roomId]
  );

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to add extra class");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Extra class scheduled", {
        description: "Students have been notified of the new class.",
      });
      queryClient.invalidateQueries({ queryKey: ["schedule-changes"] });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      reset();
    },
    onError: () => toast.error("Failed to schedule extra class. Please try again."),
  });

  const reset = () => {
    setCourseId("");
    setDay("");
    setStartTime("");
    setEndTime("");
    setRoomId("");
  };

  const pickTimeSlot = (slotId: string) => {
    const slot = timeSlots?.find((s) => s.id === slotId);
    if (slot) {
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setRoomId("");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error("Please select a course.");
      return;
    }
    if (!day || !startTime || !endTime) {
      toast.error("Please pick a day and time slot.");
      return;
    }
    if (!selectedRoom) {
      toast.error("Please pick an available room.");
      return;
    }
    mutation.mutate({
      changeType: "extra_class",
      newDay: day,
      newStartTime: startTime,
      newEndTime: endTime,
      newRoomId: roomId,
      newRoomNumber: selectedRoom.roomNumber,
      courseName: selectedCourse.name,
      courseCode: selectedCourse.code,
      teacherId,
      teacherName,
      semester,
      program,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="lg:col-span-3 card-3d p-5 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-amber-glow">
            <CalendarPlus className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Schedule Extra Class</h3>
            <p className="text-[11px] text-muted-foreground">
              One-off class — students get an auto-generated notice
            </p>
          </div>
        </div>

        {/* Course */}
        <div>
          <Label className="text-xs">Course</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="mt-1.5 h-10 w-full">
              <SelectValue placeholder="Pick a course" />
            </SelectTrigger>
            <SelectContent>
              {(courses ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    {c.type === "lab" ? (
                      <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                    )}
                    {c.code} — {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Day & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Day</Label>
            <Select
              value={day}
              onValueChange={(v) => {
                setDay(v);
                setRoomId("");
              }}
            >
              <SelectTrigger className="mt-1.5 h-10 w-full">
                <SelectValue placeholder="Pick day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setRoomId("");
              }}
              className="mt-1.5 h-10"
            />
          </div>
          <div>
            <Label className="text-xs">End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setRoomId("");
              }}
              className="mt-1.5 h-10"
            />
          </div>
        </div>

        {/* Quick slot picker */}
        {timeSlots && timeSlots.length > 0 && (
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Or pick a slot
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {timeSlots
                .filter((s) => !s.isBreak)
                .map((s) => {
                  const active =
                    startTime === s.startTime && endTime === s.endTime;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickTimeSlot(s.id)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors",
                        active
                          ? "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-glow"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {s.startTime}–{s.endTime}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Room */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs">Room</Label>
            {canQueryRooms && !roomsLoading && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  availableRooms.length > 0
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/15 text-red-700 dark:text-red-300"
                )}
              >
                {availableRooms.length} available
                {bookedCount > 0 && ` · ${bookedCount} booked`}
              </span>
            )}
          </div>
          {!canQueryRooms ? (
            <div className="h-10 rounded-md border border-dashed border-border flex items-center justify-center text-[11px] text-muted-foreground">
              Select day &amp; time first
            </div>
          ) : roomsLoading ? (
            <div className="h-10 rounded-md border border-border flex items-center justify-center text-[11px] text-muted-foreground gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking
              availability…
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="h-10 rounded-md border border-red-500/40 bg-red-500/5 flex items-center justify-center text-[11px] text-red-700 dark:text-red-300 gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> No {roomTypeFilter ?? "rooms"}{" "}
              available at this time
            </div>
          ) : (
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pick available room" />
              </SelectTrigger>
              <SelectContent>
                {(roomsWithAvail ?? []).map((r) => (
                  <SelectItem
                    key={r.id}
                    value={r.id}
                    disabled={r.available === false}
                    className="text-xs"
                  >
                    Room {r.roomNumber}
                    {r.available === false && " (booked)"}
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      · {r.type} · cap {r.capacity}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Course-derived info (read-only) */}
        {selectedCourse && (
          <div className="grid grid-cols-3 gap-2">
            <InfoChip label="Program" value={program.toUpperCase()} />
            <InfoChip label="Semester" value={`Sem ${semester}`} />
            <InfoChip
              label="Type"
              value={classType === "lab" ? "Lab" : "Theory"}
              tone={classType === "lab" ? "amber" : "teal"}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending || !canQueryRooms || !roomId || !courseId}
          className="w-full h-11 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-3d shadow-amber-glow"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="h-4 w-4" />
          )}
          {mutation.isPending ? "Scheduling…" : "Schedule Extra Class"}
        </Button>
      </motion.form>

      {/* Live preview */}
      <div className="lg:col-span-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-3d p-4 sticky top-4"
        >
          <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" /> Preview
          </h3>
          <div
            className={cn(
              "rounded-xl overflow-hidden border",
              classType === "lab"
                ? "border-amber-500/40"
                : "border-teal-500/40"
            )}
          >
            <div
              className={cn(
                "h-1.5 bg-gradient-to-r",
                classType === "lab"
                  ? "from-amber-500 via-orange-500 to-yellow-500"
                  : "from-teal-500 via-emerald-500 to-cyan-500"
              )}
            />
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r",
                    classType === "lab"
                      ? "from-amber-500 to-orange-500"
                      : "from-teal-500 to-emerald-500"
                  )}
                >
                  {classType === "lab" ? (
                    <FlaskConical className="h-3 w-3" />
                  ) : (
                    <BookOpen className="h-3 w-3" />
                  )}
                  {selectedCourse?.code ?? "CSE XXX"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {program} · Sem {semester}
                </span>
              </div>
              <h4 className="font-semibold text-sm">
                {selectedCourse?.name ?? "Select a course"}
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">
                    {day || "—"} {startTime && endTime ? `${startTime}–${endTime}` : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>Room {selectedRoom?.roomNumber ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span>{teacherName}</span>
                </div>
              </div>
              <Badge
                className={cn(
                  "mt-2 text-[10px] h-5",
                  "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                )}
              >
                Extra Class
              </Badge>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            This extra class will be added to your schedule and broadcast to
            students via an auto-generated notice.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "teal" | "amber";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
      : tone === "teal"
      ? "border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
      : "border-border bg-muted/40 text-foreground";
  return (
    <div className={cn("rounded-lg border px-2.5 py-1.5", toneClass)}>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-xs font-bold mt-0.5">{value}</p>
    </div>
  );
}
