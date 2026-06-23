"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, FlaskConical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRealtimeCourses } from "@/hooks/use-realtime-data";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseForm {
  id?: string;
  name: string;
  code: string;
  creditHours: number;
  type: "theory" | "lab";
  semester: number;
  program: "bsc" | "msc";
}

const EMPTY: CourseForm = {
  name: "",
  code: "",
  creditHours: 3,
  type: "theory",
  semester: 1,
  program: "bsc",
};

export function CoursesSection() {
  const { data: courses, isLoading } = useRealtimeCourses();
  const mutation = useAdminMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY);
  const [filterProgram, setFilterProgram] = useState<string>("all");

  const filtered = useMemo(
    () => courses?.filter((c) => filterProgram === "all" || c.program === filterProgram) ?? [],
    [courses, filterProgram]
  );

  const openAdd = () => { setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (c: typeof courses[number]) => {
    setForm({ id: c.id, name: c.name, code: c.code, creditHours: c.creditHours, type: c.type, semester: c.semester, program: c.program });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name || !form.code) { toast.error("Name and code are required"); return; }
    mutation.mutate({
      method: form.id ? "PUT" : "POST",
      url: "/api/courses",
      body: form,
      successMsg: form.id ? "Course updated" : "Course added",
    }, { onSettled: () => setDialogOpen(false) });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate({
      method: "DELETE",
      url: `/api/courses?id=${deleteId}`,
      successMsg: "Course removed",
    }, { onSettled: () => setDeleteId(null) });
  };

  return (
    <div>
      <SectionHeader
        title="Courses"
        description="Manage the course catalogue across all programs and semesters."
        icon={BookOpen}
        badge={courses?.length ?? 0}
        action={
          <div className="flex gap-2 items-center">
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="bsc">BSc</SelectItem>
                <SelectItem value="msc">MSc</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAdd} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading courses…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses" message="Add your first course to the catalogue." />
      ) : (
        <div className="card-3d overflow-x-auto scrollbar-premium">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Code</th>
                <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 font-semibold">Sem</th>
                <th className="text-left px-4 py-2.5 font-semibold">Prog</th>
                <th className="text-left px-4 py-2.5 font-semibold hidden sm:table-cell">Credits</th>
                <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="hover:bg-accent/40"
                >
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold text-white",
                      c.type === "lab" ? "bg-amber-500" : "bg-teal-500")}>
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {c.type === "lab" ? <FlaskConical className="h-2.5 w-2.5" /> : <BookOpen className="h-2.5 w-2.5" />}
                      {c.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.semester}</td>
                  <td className="px-4 py-2.5 text-muted-foreground uppercase text-xs">{c.program}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{c.creditHours}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-7 w-7 p-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)} className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Course Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1 h-10" placeholder="CSE313" />
            </div>
            <div>
              <Label className="text-xs">Course Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-10" placeholder="Computer Networks" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "theory" | "lab" })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Credit Hours</Label>
                <Input type="number" step="0.5" value={form.creditHours} onChange={(e) => setForm({ ...form, creditHours: Number(e.target.value) })} className="mt-1 h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>Linked schedules may break. Consider deactivating instead.</AlertDialogDescription>
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
