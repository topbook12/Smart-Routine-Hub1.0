"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRealtimeStudents } from "@/hooks/use-realtime-data";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { SectionHeader } from "@/components/admin/section-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentForm {
  id?: string;
  fullName: string;
  rollNumber: string;
  program: "bsc" | "msc";
  semester: number;
  password: string;
  isActive: boolean;
}

const EMPTY: StudentForm = {
  fullName: "",
  rollNumber: "",
  program: "bsc",
  semester: 1,
  password: "student123",
  isActive: true,
};

export function StudentsSection() {
  const { data: students, isLoading } = useRealtimeStudents();
  const mutation = useAdminMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const openAdd = () => {
    setForm(EMPTY);
    setCreatedPassword(null);
    setDialogOpen(true);
  };
  const openEdit = (s: NonNullable<typeof students>[number]) => {
    setForm({
      id: s.id,
      fullName: s.fullName,
      rollNumber: s.rollNumber,
      program: s.program as "bsc" | "msc",
      semester: s.semester,
      password: "",
      isActive: s.isActive,
    });
    setCreatedPassword(null);
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.fullName || !form.rollNumber) {
      toast.error("Full name and roll number are required");
      return;
    }
    mutation.mutate(
      {
        method: form.id ? "PUT" : "POST",
        url: "/api/students",
        body: form,
        successMsg: form.id ? "Student updated" : "Student added",
        errorMsg: "Save failed — check roll number for duplicates",
        invalidateKeys: [["students"]],
      },
      {
        onSuccess: (data) => {
          // If new student created, show the password so admin can share it
          if (!form.id && data?.password) {
            setCreatedPassword(data.password);
          } else {
            setDialogOpen(false);
          }
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate(
      {
        method: "DELETE",
        url: `/api/students?id=${deleteId}`,
        successMsg: "Student removed",
        invalidateKeys: [["students"]],
      },
      { onSettled: () => setDeleteId(null) }
    );
  };

  return (
    <div>
      <SectionHeader
        title="Students"
        description="Create and manage student accounts. Students login with their roll number and password to view their schedule."
        icon={GraduationCap}
        badge={students?.length ?? 0}
        action={
          <Button onClick={openAdd} className="btn-3d btn-ink gap-1.5">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        }
      />

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-4 mb-5 bg-gold/5"
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-gold flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-ink" />
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-1">How student accounts work</p>
            <p className="text-xs text-muted-foreground">
              When you add a student, they get a roll number and password. Share these credentials with the student.
              They login at the Student tab on the login page using their roll number and password.
              Default password is <code className="text-foreground font-medium">student123</code> — you can change it.
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <LoadingState message="Loading students…" />
      ) : !students || students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students" message="Add your first student account." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              whileHover={{ y: -3 }}
              className="card-3d card-inner-glow p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-ink flex items-center justify-center text-white font-bold shrink-0">
                  {s.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{s.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">Roll: {s.rollNumber}</p>
                </div>
                {!s.isActive && (
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">Inactive</Badge>
                )}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-3">
                <span className="uppercase">{s.program}</span>
                <span>·</span>
                <span>Sem {s.semester}</span>
              </div>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)} className="h-7 text-xs gap-1 flex-1">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteId(s.id)}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setCreatedPassword(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>

          {createdPassword ? (
            // Show created credentials after successful creation
            <div className="space-y-4">
              <div className="card-3d p-4 bg-gold/10">
                <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gold-deep" /> Student Account Created
                </p>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {form.fullName}</p>
                  <p><span className="text-muted-foreground">Roll Number:</span> <code className="font-mono font-bold">{form.rollNumber}</code></p>
                  <p><span className="text-muted-foreground">Password:</span> <code className="font-mono font-bold">{createdPassword}</code></p>
                  <p><span className="text-muted-foreground">Program:</span> {form.program.toUpperCase()} · Semester {form.semester}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Share these credentials with the student. They can login at the login page → Student tab.
              </p>
              <Button onClick={() => setDialogOpen(false)} className="w-full btn-3d btn-ink">
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs">Full Name *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1.5 h-10" placeholder="John Doe" />
                </div>
                <div>
                  <Label className="text-xs">Roll Number *</Label>
                  <Input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} className="mt-1.5 h-10" placeholder="30001" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Program</Label>
                    <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v as "bsc" | "msc" })}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bsc">BSc</SelectItem>
                        <SelectItem value="msc">MSc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Semester</Label>
                    <Select value={String(form.semester)} onValueChange={(v) => setForm({ ...form, semester: Number(v) })}>
                      <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {form.program === "msc"
                          ? [1, 2, 3].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)
                          : [1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{form.id ? "New Password (leave blank to keep)" : "Password *"}</Label>
                  <Input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="mt-1.5 h-10"
                    placeholder="student123"
                  />
                </div>
                {form.id && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border">
                    <Label className="text-xs">Active (can login)</Label>
                    <Switch checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={mutation.isPending} className="btn-3d btn-ink">
                  {mutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student account. They will no longer be able to login.
            </AlertDialogDescription>
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
