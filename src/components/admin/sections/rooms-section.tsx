"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Plus, Building, Users, FlaskConical, BookOpen, Presentation } from "lucide-react";
import { useRealtimeRooms } from "@/hooks/use-realtime-data";
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
import { toast } from "sonner";
import type { Room } from "@/types";

type RoomType = "classroom" | "lab" | "seminar";

interface FormState {
  id?: string;
  roomNumber: string;
  building: string;
  type: RoomType;
  capacity: number;
}

const EMPTY_FORM: FormState = {
  roomNumber: "",
  building: "",
  type: "classroom",
  capacity: 40,
};

const ROOM_ICONS: Record<RoomType, React.ComponentType<{ className?: string }>> = {
  classroom: BookOpen,
  lab: FlaskConical,
  seminar: Presentation,
};

const ROOM_BADGES: Record<RoomType, string> = {
  classroom: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  lab: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  seminar: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
};

export function RoomsSection({ autoOpenAddSignal }: { autoOpenAddSignal?: number }) {
  const { data: rooms, isLoading } = useRealtimeRooms();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<"all" | RoomType>("all");

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

  const openEdit = (r: Room) => {
    setForm({
      id: r.id,
      roomNumber: r.roomNumber,
      building: r.building || "",
      type: r.type,
      capacity: r.capacity,
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const body = { ...data, capacity: Number(data.capacity) };
      if (isEdit) {
        const { id, ...rest } = body;
        const res = await fetch("/api/rooms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...rest }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
        return res.json();
      } else {
        const { id: _id, ...rest } = body as FormState & { id?: string };
        void _id;
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Room updated" : "Room added");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rooms?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Room deleted");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = React.useMemo(() => {
    if (!rooms) return [];
    if (filterType === "all") return rooms;
    return rooms.filter((r) => r.type === filterType);
  }, [rooms, filterType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomNumber) {
      toast.error("Room number is required");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Rooms"
        description="Classrooms, laboratories & seminar halls"
        icon={MapPin}
        action={<AddButton onClick={openCreate} label="Add Room" icon={Plus} />}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "classroom", "lab", "seminar"] as const).map((t) => {
          const active = filterType === t;
          const Icon = t === "all" ? Building : ROOM_ICONS[t as RoomType];
          const count =
            t === "all" ? rooms?.length ?? 0 : rooms?.filter((r) => r.type === t).length ?? 0;
          return (
            <motion.button
              key={t}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilterType(t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-transparent shadow-teal-glow"
                  : "bg-card/60 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="capitalize">{t}</span>
              <span className={`text-[10px] px-1.5 rounded-md ${active ? "bg-white/20" : "bg-muted"}`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingState message="Loading rooms…" />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No rooms found"
          message={filterType !== "all" ? "Try a different filter." : "Add your first room to get started."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r, i) => {
            const Icon = ROOM_ICONS[r.type];
            const isLab = r.type === "lab";
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                whileHover={{ y: -4 }}
                className="card-3d card-inner-glow p-4 group"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center text-white ${
                        isLab
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-glow"
                          : "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-glow"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        ROOM_BADGES[r.type]
                      }`}
                    >
                      {r.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-base">{r.roomNumber}</h3>
                  {r.building && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building className="h-3 w-3" /> {r.building}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3 text-primary" />
                    Capacity: <span className="font-semibold text-foreground">{r.capacity}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-end">
                    <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {isEdit ? "Edit Room" : "Add New Room"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update room information."
                : "Add a new classroom, lab, or seminar room."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Room Number" htmlFor="roomNumber" required>
              <Input
                id="roomNumber"
                required
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="e.g. 301, Lab-2, Seminar Hall"
              />
            </Field>
            <Field label="Building" htmlFor="building">
              <Input
                id="building"
                value={form.building}
                onChange={(e) => setForm({ ...form, building: e.target.value })}
                placeholder="3rd Science Building"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" required>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as RoomType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classroom">Classroom</SelectItem>
                    <SelectItem value="lab">Laboratory</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Capacity" htmlFor="capacity" required>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </Field>
            </div>
            <DialogFooter>
              <SubmitButton loading={mutation.isPending}>
                {isEdit ? "Save Changes" : "Create Room"}
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
        title="Delete room?"
        description="This permanently removes the room. Schedules referencing this room will remain but may show stale data."
      />
    </SectionShell>
  );
}
