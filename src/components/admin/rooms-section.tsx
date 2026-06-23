"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRealtimeRooms } from "@/hooks/use-realtime-data";
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
import { cn } from "@/lib/utils";

interface RoomForm {
  id?: string;
  roomNumber: string;
  building: string;
  type: "classroom" | "lab" | "seminar";
  capacity: number;
}

const EMPTY: RoomForm = { roomNumber: "", building: "ICE Building", type: "classroom", capacity: 45 };

const TYPE_STYLES: Record<string, string> = {
  classroom: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  lab: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  seminar: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
};

export function RoomsSection() {
  const { data: rooms, isLoading } = useRealtimeRooms();
  const mutation = useAdminMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomForm>(EMPTY);

  const openAdd = () => { setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (r: typeof rooms[number]) => {
    setForm({ id: r.id, roomNumber: r.roomNumber, building: r.building || "", type: r.type, capacity: r.capacity });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.roomNumber) return;
    mutation.mutate({
      method: form.id ? "PUT" : "POST",
      url: "/api/rooms",
      body: form,
      successMsg: form.id ? "Room updated" : "Room added",
    }, { onSettled: () => setDialogOpen(false) });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate({ method: "DELETE", url: `/api/rooms?id=${deleteId}`, successMsg: "Room removed" }, {
      onSettled: () => setDeleteId(null),
    });
  };

  return (
    <div>
      <SectionHeader
        title="Rooms"
        description="Classrooms, labs and seminar halls available for scheduling."
        icon={MapPin}
        badge={rooms?.length ?? 0}
        action={
          <Button onClick={openAdd} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading rooms…" />
      ) : !rooms || rooms.length === 0 ? (
        <EmptyState icon={MapPin} title="No rooms" message="Add your first room." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {rooms.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              whileHover={{ y: -3 }}
              className="card-3d card-inner-glow p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0",
                  r.type === "lab" ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-glow" :
                  r.type === "seminar" ? "bg-gradient-to-br from-cyan-500 to-teal-500 shadow-cyan-glow" :
                  "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-glow"
                )}>
                  <MapPin className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={cn("text-[10px] capitalize", TYPE_STYLES[r.type])}>{r.type}</Badge>
              </div>
              <p className="font-bold text-base">{r.roomNumber}</p>
              <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                <p className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {r.building || "—"}</p>
                <p className="flex items-center gap-1"><Users className="h-3 w-3" /> Capacity: {r.capacity}</p>
              </div>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)} className="h-7 text-xs gap-1 flex-1">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDeleteId(r.id)} className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Room" : "Add Room"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Room Number / Name *</Label>
              <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="mt-1 h-10" placeholder="101 / Lab-A" />
            </div>
            <div>
              <Label className="text-xs">Building</Label>
              <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="mt-1 h-10" placeholder="ICE Building" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as RoomForm["type"] })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classroom">Classroom</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="mt-1 h-10" />
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
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>Linked schedules may break.</AlertDialogDescription>
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
