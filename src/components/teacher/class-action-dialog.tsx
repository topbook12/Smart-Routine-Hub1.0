"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  XCircle,
  CalendarDays,
  Filter,
} from "lucide-react";
import type { Schedule, ScheduleChange, DayOfWeek } from "@/types";
import { DAYS } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  roomNumber: string;
  building?: string | null;
  type: string;
  capacity: number;
}

type Mode = "menu" | "reschedule" | "cancel";

export function ClassActionDialog({
  schedule,
  open,
  onOpenChange,
}: {
  schedule: Schedule | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("menu");
  const qc = useQueryClient();

  // Reset to menu when dialog opens
  useEffect(() => {
    if (open) setMode("menu");
  }, [open]);

  if (!schedule) return null;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["schedules"] });
    qc.invalidateQueries({ queryKey: ["schedule-changes"] });
    qc.invalidateQueries({ queryKey: ["notices"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-gold-deep" />
            {mode === "menu" && "Class Options"}
            {mode === "reschedule" && "Reschedule Class"}
            {mode === "cancel" && "Cancel Class"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {mode === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <ClassInfoBlock schedule={schedule} />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setMode("reschedule")}
                  className="group card-3d card-inner-glow p-4 text-left hover:shadow-lg transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-gold flex items-center justify-center text-black mb-2">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-sm">Reschedule</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Move to a different day, time or room. See which rooms are free.
                  </p>
                </button>
                <button
                  onClick={() => setMode("cancel")}
                  className="group card-3d p-4 text-left hover:shadow-lg transition-all border-destructive/20"
                >
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-sm">Cancel Class</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Cancel this class with a reason. Students get notified.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {mode === "reschedule" && (
            <RescheduleForm
              schedule={schedule}
              onCancel={() => setMode("menu")}
              onSuccess={() => {
                invalidateAll();
                onOpenChange(false);
              }}
            />
          )}

          {mode === "cancel" && (
            <CancelForm
              schedule={schedule}
              onCancel={() => setMode("menu")}
              onSuccess={() => {
                invalidateAll();
                onOpenChange(false);
              }}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ClassInfoBlock({ schedule }: { schedule: Schedule }) {
  return (
    <div className="card-3d p-3 bg-muted/40">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold text-white",
            schedule.classType === "lab" ? "bg-gold text-black" : "bg-ink"
          )}
        >
          {schedule.courseCode}
        </span>
        <span className="font-semibold text-sm">{schedule.courseName}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> {schedule.dayOfWeek}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {schedule.startTime} – {schedule.endTime}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Room {schedule.roomNumber}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="uppercase">{schedule.program}</span> · Sem {schedule.semester}
        </div>
      </div>
    </div>
  );
}

function RescheduleForm({
  schedule,
  onCancel,
  onSuccess,
}: {
  schedule: Schedule;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [newDay, setNewDay] = useState<string>(schedule.dayOfWeek);
  const [newStartTime, setNewStartTime] = useState<string>(schedule.startTime);
  const [newEndTime, setNewEndTime] = useState<string>(schedule.endTime);
  const [newRoomId, setNewRoomId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Fetch room availability for selected day + time
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const canQuery = newDay && newStartTime && newEndTime;
  const currentRoomBooked = useMemo(() => {
    // If teacher picked same day/time/room, it's "booked" by this very class — that's fine
    if (!rooms.length) return false;
    const r = rooms.find((r) => r.id === newRoomId);
    return r && !r.available && r.id !== schedule.roomId;
  }, [rooms, newRoomId, schedule.roomId]);

  useEffect(() => {
    if (!canQuery) return;
    setLoadingRooms(true);
    setNewRoomId("");
    const controller = new AbortController();
    fetch(
      `/api/rooms?day=${encodeURIComponent(newDay)}&startTime=${encodeURIComponent(newStartTime)}&endTime=${encodeURIComponent(newEndTime)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        // Mark the current class's own room as available (it's "free" for this class)
        const adjusted = data.map((r: Room & { available: boolean }) => ({
          ...r,
          available: r.available || r.id === schedule.roomId,
        }));
        setRooms(adjusted);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
    return () => controller.abort();
  }, [newDay, newStartTime, newEndTime]);

  const availableCount = rooms.filter((r) => r.available).length;
  const bookedCount = rooms.length - availableCount;

  const submit = async () => {
    if (!newRoomId) {
      toast.error("Please select a room");
      return;
    }
    setSaving(true);
    try {
      const selectedRoom = rooms.find((r) => r.id === newRoomId);
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeType: "rescheduled",
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
          newRoomNumber: selectedRoom?.roomNumber,
          reason: reason || "Rescheduled by teacher",
          courseName: schedule.courseName,
          courseCode: schedule.courseCode,
          teacherId: schedule.teacherId,
          teacherName: schedule.teacherName,
          semester: schedule.semester,
          program: schedule.program,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to reschedule");
      }
      toast.success("Class rescheduled", {
        description: `Moved to ${newDay}, ${newStartTime}–${newEndTime}, Room ${selectedRoom?.roomNumber}`,
      });
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reschedule");
    } finally {
      setSaving(false);
    }
  };

  // Quick time slot chips
  const timeSlots = [
    "09:30 AM", "10:30 AM", "11:30 AM", "12:30 PM",
    "02:15 PM", "03:15 PM",
  ];

  return (
    <motion.div
      key="reschedule"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-4"
    >
      <ClassInfoBlock schedule={schedule} />

      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5" />
        Original: {schedule.dayOfWeek}, {schedule.startTime}–{schedule.endTime}, Room {schedule.roomNumber}
      </div>

      <div>
        <Label className="text-xs">New Day</Label>
        <Select value={newDay} onValueChange={setNewDay}>
          <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Start Time</Label>
          <Input value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="mt-1.5 h-10" placeholder="09:30 AM" />
        </div>
        <div>
          <Label className="text-xs">End Time</Label>
          <Input value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="mt-1.5 h-10" placeholder="10:30 AM" />
        </div>
      </div>

      {/* Quick time slot chips */}
      <div className="flex flex-wrap gap-1.5">
        {timeSlots.map((t) => (
          <button
            key={t}
            onClick={() => {
              setNewStartTime(t);
              // Auto-set end time 1 hour later
              const [time, period] = t.split(" ");
              const [h, m] = time.split(":").map(Number);
              let newH = h + 1;
              let newP = period;
              if (newH > 12) { newH -= 12; newP = newP === "AM" ? "PM" : "AM"; }
              if (newH === 12) newP = newP === "AM" ? "PM" : "AM";
              setNewEndTime(`${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${newP}`);
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
              newStartTime === t
                ? "bg-ink text-white border-ink"
                : "bg-card border-border text-muted-foreground hover:border-ink/40"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Room availability */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs">Select Room</Label>
          {rooms.length > 0 && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {availableCount} free
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3 w-3" /> {bookedCount} booked
              </span>
            </div>
          )}
        </div>
        {loadingRooms ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking room availability…
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-3 text-sm text-muted-foreground">
            Select a day and time to see available rooms.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto scrollbar-premium space-y-1.5 pr-1">
            {rooms.map((r) => {
              const available = (r as Room & { available: boolean }).available;
              const selected = newRoomId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => available && setNewRoomId(r.id)}
                  disabled={!available}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                    selected
                      ? "border-ink bg-ink/5 ring-1 ring-ink/20"
                      : available
                      ? "border-border hover:border-ink/40 hover:bg-accent/40 cursor-pointer"
                      : "border-border opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    available ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                  )}>
                    {available ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Room {r.roomNumber}</p>
                    <p className="text-[10px] text-muted-foreground">{r.type} · Cap {r.capacity} · {r.building || "—"}</p>
                  </div>
                  {selected && <Badge className="text-[9px] h-5 badge-ink">Selected</Badge>}
                </button>
              );
            })}
          </div>
        )}
        {currentRoomBooked && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-destructive">
            <AlertCircle className="h-3 w-3" /> This room is already booked for the selected time.
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Reason (optional)</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5" rows={2} placeholder="e.g. Official meeting conflict" />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>← Back</Button>
        <Button onClick={submit} disabled={saving || !newRoomId} className="btn-3d btn-ink gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
          {saving ? "Rescheduling…" : "Confirm Reschedule"}
        </Button>
      </DialogFooter>
    </motion.div>
  );
}

function CancelForm({
  schedule,
  onCancel,
  onSuccess,
}: {
  schedule: Schedule;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeType: "cancelled",
          scheduleId: schedule.id,
          originalDay: schedule.dayOfWeek,
          originalStartTime: schedule.startTime,
          originalEndTime: schedule.endTime,
          originalRoomId: schedule.roomId,
          originalRoomNumber: schedule.roomNumber,
          reason: reason || "Cancelled by teacher",
          courseName: schedule.courseName,
          courseCode: schedule.courseCode,
          teacherId: schedule.teacherId,
          teacherName: schedule.teacherName,
          semester: schedule.semester,
          program: schedule.program,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to cancel");
      }
      toast.success("Class cancelled", {
        description: `${schedule.courseCode} on ${schedule.dayOfWeek} has been cancelled. Students will be notified.`,
      });
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="cancel"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-4"
    >
      <ClassInfoBlock schedule={schedule} />

      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">This class will be cancelled</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students enrolled in {schedule.program.toUpperCase()} Semester {schedule.semester} will receive an automatic notification.
            This action cannot be undone from this dialog.
          </p>
        </div>
      </div>

      <div>
        <Label className="text-xs">Reason for cancellation</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1.5"
          rows={3}
          placeholder="e.g. Emergency, official holiday, teacher unavailable…"
          autoFocus
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>← Back</Button>
        <Button onClick={submit} disabled={saving} className="btn-3d bg-destructive hover:bg-destructive/90 text-white gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          {saving ? "Cancelling…" : "Confirm Cancel"}
        </Button>
      </DialogFooter>
    </motion.div>
  );
}
