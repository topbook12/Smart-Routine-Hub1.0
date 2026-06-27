"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Pencil, Save, X, CalendarDays, Clock, MapPin, RotateCcw } from "lucide-react";
import { useRealtimeSchedules, useRealtimeRooms, useRealtimeScheduleChanges } from "@/hooks/use-realtime-data";
import { DAYS, type DayOfWeek } from "@/types";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function EditScheduleTab({ teacherId }: { teacherId: string }) {
  const qc = useQueryClient();
  const { data: schedules, isLoading } = useRealtimeSchedules({ teacherId });
  const { data: rooms } = useRealtimeRooms();
  const { data: changes } = useRealtimeScheduleChanges({ teacherId });

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ startTime: string; endTime: string; dayOfWeek: string; roomId: string }>({
    startTime: "",
    endTime: "",
    dayOfWeek: "",
    roomId: "",
  });
  const [saving, setSaving] = useState(false);

  const changeMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof changes>[number]>();
    changes?.forEach((c) => {
      if (c.scheduleId) m.set(c.scheduleId, c);
    });
    return m;
  }, [changes]);

  const openEdit = (s: NonNullable<typeof schedules>[number]) => {
    setEditId(s.id);
    setEditForm({
      startTime: s.startTime,
      endTime: s.endTime,
      dayOfWeek: s.dayOfWeek,
      roomId: s.roomId,
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          dayOfWeek: editForm.dayOfWeek,
          roomId: editForm.roomId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Update failed" }));
        throw new Error(err.error || "Update failed");
      }
      await qc.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Class updated");
      setEditId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Group by day
  const grouped = useMemo(() => {
    const m = new Map<DayOfWeek, NonNullable<typeof schedules>[number][]>();
    for (const d of DAYS) m.set(d, []);
    for (const s of schedules ?? []) {
      const arr = m.get(s.dayOfWeek as DayOfWeek);
      if (arr) arr.push(s);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [schedules]);

  if (isLoading) return <LoadingState message="Loading your classes…" />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="h-5 w-5 text-gold-deep" />
        <h2 className="text-lg font-bold">Edit My Classes</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Change the day, time or room of any of your classes directly. Cancellations and reschedules are handled in the Manage tab.
      </p>

      {!schedules || schedules.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No classes assigned" message="You don't have any classes to edit yet." />
      ) : (
        <div className="space-y-5">
          {DAYS.map((d) => {
            const items = grouped.get(d) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={d}>
                <h3 className="font-semibold text-sm mb-2">{d} <Badge variant="outline" className="text-[10px] h-5 ml-1">{items.length}</Badge></h3>
                <div className="space-y-2">
                  {items.map((s) => {
                    const change = changeMap.get(s.id);
                    const isCancelled = change?.changeType === "cancelled";
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("card-3d p-3 flex flex-wrap items-center gap-3", isCancelled && "opacity-60")}
                      >
                        <div className={cn("h-10 w-1.5 rounded-full shrink-0", s.classType === "lab" ? "bg-gold" : "bg-ink")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", s.classType === "lab" ? "badge-lab" : "badge-theory")}>
                              {s.courseCode}
                            </span>
                            <span className="font-semibold text-sm truncate">{s.courseName}</span>
                            {isCancelled && <Badge variant="destructive" className="text-[9px] h-4">Cancelled</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.startTime}–{s.endTime}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> R-{s.roomNumber}</span>
                            <span className="uppercase">{s.program} · Sem {s.semester}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openEdit(s)} className="h-8 text-xs gap-1 shrink-0">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Day</Label>
              <Select value={editForm.dayOfWeek} onValueChange={(v) => setEditForm({ ...editForm, dayOfWeek: v })}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="mt-1.5 h-10" placeholder="09:30 AM" />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} className="mt-1.5 h-10" placeholder="10:30 AM" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Room</Label>
              <Select value={editForm.roomId} onValueChange={(v) => setEditForm({ ...editForm, roomId: v })}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rooms?.map((r) => <SelectItem key={r.id} value={r.id}>{r.roomNumber} ({r.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)} className="gap-1"><X className="h-4 w-4" /> Cancel</Button>
            <Button onClick={saveEdit} disabled={saving} className="btn-3d btn-ink gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
