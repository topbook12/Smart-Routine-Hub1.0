"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CalendarX,
  Clock,
  FlaskConical,
  Loader2,
  MapPin,
  MoveRight,
  XCircle,
} from "lucide-react";
import {
  useRealtimeSchedules,
  useRealtimeScheduleChanges,
  useRealtimeTimeSlots,
} from "@/hooks/use-realtime-data";
import { DAYS, type DayOfWeek, type Schedule, type ScheduleChange } from "@/types";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  teacherId: string;
  teacherName: string;
}

type RoomWithAvail = {
  id: string;
  roomNumber: string;
  building?: string | null;
  type: string;
  capacity: number;
  isActive: boolean;
  available?: boolean;
};

export function CancelRescheduleTab({ teacherId, teacherName }: Props) {
  const { data: schedules, isLoading } = useRealtimeSchedules({ teacherId });
  const { data: changes } = useRealtimeScheduleChanges({ teacherId });
  const [cancelTarget, setCancelTarget] = useState<Schedule | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Schedule | null>(null);

  const changeMap = useMemo(() => {
    const m = new Map<string, ScheduleChange>();
    changes?.forEach((c) => {
      if (c.scheduleId && !m.has(c.scheduleId)) m.set(c.scheduleId, c);
    });
    return m;
  }, [changes]);

  // Sorted by day, then by start time
  const sorted = useMemo(() => {
    if (!schedules) return [];
    return [...schedules].sort(
      (a, b) =>
        DAYS.indexOf(a.dayOfWeek as DayOfWeek) -
          DAYS.indexOf(b.dayOfWeek as DayOfWeek) ||
        a.startTime.localeCompare(b.startTime)
    );
  }, [schedules]);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-4 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <CalendarClock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Manage Your Classes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cancel or reschedule any of your upcoming classes. A notice will be
              auto-generated for students.
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <LoadingState message="Loading your classes…" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No classes to manage"
          message="You have no scheduled classes. Classes added as extra will also appear here for future management."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((s, i) => {
            const change = changeMap.get(s.id);
            const isCancelled = change?.changeType === "cancelled";
            const isLab = s.classType === "lab";
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                whileHover={{ y: -2 }}
                className={cn(
                  "card-3d card-inner-glow p-4",
                  isCancelled && "opacity-70"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{s.courseCode}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {s.courseName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" /> {s.dayOfWeek}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {s.startTime}–{s.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Room {s.roomNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-muted/60 uppercase font-medium">
                          {s.program} · Sem {s.semester}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  {change && (
                    <ChangeStatusBadge change={change} />
                  )}

                  {/* Right: action buttons */}
                  {!isCancelled && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        onClick={() => setCancelTarget(s)}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-3d shadow-amber-glow"
                        onClick={() => setRescheduleTarget(s)}
                      >
                        <MoveRight className="h-3.5 w-3.5" /> Reschedule
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      <CancelDialog
        schedule={cancelTarget}
        onClose={() => setCancelTarget(null)}
        teacherId={teacherId}
        teacherName={teacherName}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        schedule={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        teacherId={teacherId}
        teacherName={teacherName}
      />
    </div>
  );
}

function ChangeStatusBadge({ change }: { change: ScheduleChange }) {
  if (change.changeType === "cancelled") {
    return (
      <Badge variant="destructive" className="text-[10px] h-6 gap-1">
        <XCircle className="h-3 w-3" /> Cancelled
      </Badge>
    );
  }
  if (change.changeType === "rescheduled") {
    return (
      <Badge
        className="text-[10px] h-6 gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
      >
        <MoveRight className="h-3 w-3" /> Moved → {change.newDay?.slice(0, 3)}{" "}
        {change.newStartTime}
      </Badge>
    );
  }
  if (change.changeType === "room_changed") {
    return (
      <Badge className="text-[10px] h-6 gap-1 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">
        <MapPin className="h-3 w-3" /> Room → {change.newRoomNumber}
      </Badge>
    );
  }
  return null;
}

/* ---------- Cancel Dialog ---------- */
function CancelDialog({
  schedule,
  onClose,
  teacherId,
  teacherName,
}: {
  schedule: Schedule | null;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to cancel class");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Class cancelled", {
        description: "Students have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["schedule-changes"] });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setReason("");
      onClose();
    },
    onError: () => {
      toast.error("Failed to cancel class. Please try again.");
    },
  });

  const onSubmit = () => {
    if (!schedule) return;
    mutation.mutate({
      changeType: "cancelled",
      scheduleId: schedule.id,
      originalDay: schedule.dayOfWeek,
      originalStartTime: schedule.startTime,
      originalEndTime: schedule.endTime,
      originalRoomId: schedule.roomId,
      originalRoomNumber: schedule.roomNumber,
      reason: reason.trim() || "Cancelled by teacher",
      courseName: schedule.courseName,
      courseCode: schedule.courseCode,
      teacherId,
      teacherName,
      semester: schedule.semester,
      program: schedule.program,
    });
  };

  return (
    <Dialog
      open={!!schedule}
      onOpenChange={(o) => {
        if (!o) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Cancel Class
          </DialogTitle>
          <DialogDescription>
            This will notify all enrolled students via an auto-generated notice.
          </DialogDescription>
        </DialogHeader>

        {schedule && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Course</span>
              <span className="font-semibold">{schedule.courseCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Schedule</span>
              <span className="font-medium">
                {schedule.dayOfWeek}, {schedule.startTime}–{schedule.endTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Room</span>
              <span className="font-medium">{schedule.roomNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Section</span>
              <span className="font-medium uppercase">
                {schedule.program} · Sem {schedule.semester}
              </span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="cancel-reason" className="text-xs">
            Reason (optional)
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Personal emergency, holiday, faculty meeting…"
            className="mt-1.5 min-h-[80px] resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Keep Class
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={mutation.isPending}
            className="gap-1.5"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Reschedule Dialog ---------- */
function RescheduleDialog({
  schedule,
  onClose,
  teacherId,
  teacherName,
}: {
  schedule: Schedule | null;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}) {
  const queryClient = useQueryClient();
  const { data: timeSlots } = useRealtimeTimeSlots();
  const [newDay, setNewDay] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState<string>("");
  const [newEndTime, setNewEndTime] = useState<string>("");
  const [newRoomId, setNewRoomId] = useState<string>("");
  const [reason, setReason] = useState("");

  // Reset state when dialog opens for a new schedule
  // (we use schedule?.id as a key on the dialog wrapper too)
  const canQueryRooms = !!(newDay && newStartTime && newEndTime);
  const { data: roomsWithAvail, isLoading: roomsLoading } = useQuery<RoomWithAvail[]>({
    queryKey: ["available-rooms", newDay, newStartTime, newEndTime],
    queryFn: async () => {
      const res = await fetch(
        `/api/rooms?day=${newDay}&startTime=${encodeURIComponent(
          newStartTime
        )}&endTime=${encodeURIComponent(newEndTime)}`
      );
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
    () => (roomsWithAvail ?? []).find((r) => r.id === newRoomId),
    [roomsWithAvail, newRoomId]
  );

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to reschedule class");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Class rescheduled", {
        description: "Students have been notified of the new time.",
      });
      queryClient.invalidateQueries({ queryKey: ["schedule-changes"] });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to reschedule class. Please try again.");
    },
  });

  const reset = () => {
    setNewDay("");
    setNewStartTime("");
    setNewEndTime("");
    setNewRoomId("");
    setReason("");
  };

  const onSubmit = () => {
    if (!schedule) return;
    if (!newDay || !newStartTime || !newEndTime || !newRoomId) {
      toast.error("Please select a new day, time slot, and room.");
      return;
    }
    if (!selectedRoom) {
      toast.error("Please pick an available room.");
      return;
    }
    mutation.mutate({
      changeType: "reschedule",
      scheduleId: schedule.id,
      originalDay: schedule.dayOfWeek,
      originalStartTime: schedule.startTime,
      originalEndTime: schedule.endTime,
      originalRoomId: schedule.roomId,
      originalRoomNumber: schedule.roomNumber,
      newDay,
      newStartTime,
      newEndTime,
      newRoomId,
      newRoomNumber: selectedRoom.roomNumber,
      reason: reason.trim() || undefined,
      courseName: schedule.courseName,
      courseCode: schedule.courseCode,
      teacherId,
      teacherName,
      semester: schedule.semester,
      program: schedule.program,
    });
  };

  const pickTimeSlot = (slotId: string) => {
    const slot = timeSlots?.find((s) => s.id === slotId);
    if (slot) {
      setNewStartTime(slot.startTime);
      setNewEndTime(slot.endTime);
      setNewRoomId(""); // reset room since availability depends on time
    }
  };

  return (
    <Dialog
      open={!!schedule}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <MoveRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            Reschedule Class
          </DialogTitle>
          <DialogDescription>
            Choose a new day, time, and room. Only available rooms are selectable.
          </DialogDescription>
        </DialogHeader>

        {schedule && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Course</span>
              <span className="font-semibold">{schedule.courseCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Original</span>
              <span className="font-medium">
                {schedule.dayOfWeek}, {schedule.startTime}–{schedule.endTime} ·
                Room {schedule.roomNumber}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">New Day</Label>
            <Select
              value={newDay}
              onValueChange={(v) => {
                setNewDay(v);
                setNewRoomId("");
              }}
            >
              <SelectTrigger className="mt-1.5 h-9 w-full">
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
            <Label className="text-xs">New Start</Label>
            <Input
              type="time"
              value={newStartTime}
              onChange={(e) => {
                setNewStartTime(e.target.value);
                setNewRoomId("");
              }}
              className="mt-1.5 h-9"
            />
          </div>
          <div>
            <Label className="text-xs">New End</Label>
            <Input
              type="time"
              value={newEndTime}
              onChange={(e) => {
                setNewEndTime(e.target.value);
                setNewRoomId("");
              }}
              className="mt-1.5 h-9"
            />
          </div>
        </div>

        {/* Quick time slot picker */}
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
                    newStartTime === s.startTime && newEndTime === s.endTime;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickTimeSlot(s.id)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors",
                        active
                          ? "border-transparent bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-glow"
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

        {/* Room picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs">New Room</Label>
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
            <div className="h-9 rounded-md border border-dashed border-border flex items-center justify-center text-[11px] text-muted-foreground">
              Select day &amp; time first
            </div>
          ) : roomsLoading ? (
            <div className="h-9 rounded-md border border-border flex items-center justify-center text-[11px] text-muted-foreground gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking
              availability…
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="h-9 rounded-md border border-red-500/40 bg-red-500/5 flex items-center justify-center text-[11px] text-red-700 dark:text-red-300 gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> No rooms available at this
              time
            </div>
          ) : (
            <Select
              value={newRoomId}
              onValueChange={setNewRoomId}
            >
              <SelectTrigger className="h-9 w-full">
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

        <div>
          <Label htmlFor="reschedule-reason" className="text-xs">
            Reason (optional)
          </Label>
          <Textarea
            id="reschedule-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Conflict with faculty meeting, room maintenance…"
            className="mt-1.5 min-h-[60px] resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              mutation.isPending ||
              !canQueryRooms ||
              !newRoomId
            }
            className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-3d shadow-amber-glow"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoveRight className="h-4 w-4" />
            )}
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
