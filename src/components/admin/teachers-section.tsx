"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User2,
  Users,
} from "lucide-react";
import { useRealtimeTeachers } from "@/hooks/use-realtime-data";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { SectionHeader } from "@/components/admin/section-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

interface TeacherForm {
  id?: string;
  fullName: string;
  email: string;
  designation: string;
  phone: string;
  officeRoom: string;
  bio: string;
  password: string;
  pin: string;
}

const EMPTY: TeacherForm = {
  fullName: "",
  email: "",
  designation: "Lecturer",
  phone: "",
  officeRoom: "",
  bio: "",
  password: "teacher123",
  pin: "",
};

export function TeachersSection() {
  const { data: teachers, isLoading } = useRealtimeTeachers();
  const mutation = useAdminMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm>(EMPTY);

  const openAdd = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (t: typeof teachers[number]) => {
    setForm({
      id: t.id,
      fullName: t.fullName,
      email: t.email,
      designation: t.designation || "",
      phone: t.phone || "",
      officeRoom: t.officeRoom || "",
      bio: t.bio || "",
      password: "",
      pin: "",
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.fullName || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    const payload: Record<string, unknown> = { ...form };
    if (form.id) {
      delete (payload as { password?: string }).password;
      if (!form.pin) delete (payload as { pin?: string }).pin;
    }
    mutation.mutate({
      method: "PUT",
      url: "/api/teachers",
      body: payload,
      successMsg: form.id ? "Teacher updated" : "Teacher added",
      errorMsg: "Save failed",
    }, {
      onSettled: () => setDialogOpen(false),
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate({
      method: "DELETE",
      url: `/api/teachers?id=${deleteId}`,
      successMsg: "Teacher removed",
    }, {
      onSettled: () => setDeleteId(null),
    });
  };

  return (
    <div>
      <SectionHeader
        title="Teachers"
        description="Manage faculty members who can log in and manage their classes."
        icon={Users}
        badge={teachers?.length ?? 0}
        action={
          <Button onClick={openAdd} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading teachers…" />
      ) : !teachers || teachers.length === 0 ? (
        <EmptyState icon={Users} title="No teachers" message="Add your first teacher to get started." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teachers.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              whileHover={{ y: -3 }}
              className="card-3d card-inner-glow p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold shrink-0 shadow-teal-glow">
                  {t.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{t.fullName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.designation || "Faculty"}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-primary shrink-0" /> {t.email}</p>
                {t.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-primary" /> {t.phone}</p>}
                {t.officeRoom && <p className="flex items-center gap-1.5"><User2 className="h-3 w-3 text-primary" /> {t.officeRoom}</p>}
              </div>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="h-7 text-xs gap-1 flex-1">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDeleteId(t.id)} className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 gap-1">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto scrollbar-premium pr-1">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 h-10" placeholder="Dr. John Doe" />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-10" placeholder="john@ice.ru.ac.bd" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Designation</Label>
                <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="mt-1 h-10" placeholder="Professor" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-10" placeholder="+880…" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Office Room</Label>
              <Input value={form.officeRoom} onChange={(e) => setForm({ ...form, officeRoom: e.target.value })} className="mt-1 h-10" placeholder="Room 101" />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1" rows={2} placeholder="Short bio…" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{form.id ? "New Password (optional)" : "Password *"}</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 h-10" placeholder="••••••" />
              </div>
              <div>
                <Label className="text-xs">PIN (6 digits)</Label>
                <Input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="mt-1 h-10" placeholder="000000" inputMode="numeric" />
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
            <AlertDialogTitle>Remove teacher?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the teacher account and unlink their schedules. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
