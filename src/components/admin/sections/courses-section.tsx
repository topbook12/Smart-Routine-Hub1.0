"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BookPlus, ChevronDown, ChevronRight, Search, Hash, Clock } from "lucide-react";
import { useRealtimeCourses } from "@/hooks/use-realtime-data";
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
  TypeBadge,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { semesterLabel, type Course, type Program, type ClassType } from "@/types";

interface FormState {
  id?: string;
  name: string;
  code: string;
  creditHours: number;
  type: ClassType;
  semester: number;
  program: Program;
}

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  creditHours: 3,
  type: "theory",
  semester: 1,
  program: "bsc",
};

export function CoursesSection({ autoOpenAddSignal }: { autoOpenAddSignal?: number }) {
  const { data: courses, isLoading } = useRealtimeCourses();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterProgram, setFilterProgram] = React.useState<"all" | Program>("all");
  const [expandedGroup, setExpandedGroup] = React.useState<string | null>(null);

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

  const openEdit = (c: Course) => {
    setForm({
      id: c.id,
      name: c.name,
      code: c.code,
      creditHours: c.creditHours,
      type: c.type,
      semester: c.semester,
      program: c.program,
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const body = { ...data, creditHours: Number(data.creditHours), semester: Number(data.semester) };
      if (isEdit) {
        const { id, ...rest } = body;
        const res = await fetch("/api/courses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...rest }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
        return res.json();
      } else {
        const { id: _id, ...rest } = body as FormState & { id?: string };
        void _id;
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Course updated" : "Course added");
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Course deleted");
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = React.useMemo(() => {
    if (!courses) return [];
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (filterProgram !== "all" && c.program !== filterProgram) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    });
  }, [courses, search, filterProgram]);

  const grouped = React.useMemo(() => {
    const m = new Map<string, Course[]>();
    for (const c of filtered) {
      const key = `${c.program.toUpperCase()} · Sem ${c.semester} (${semesterLabel(c.semester)})`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(c);
    }
    return Array.from(m.entries()).sort((a, b) => {
      const [pa, sa] = a[0].split(" · Sem ");
      const [pb, sb] = b[0].split(" · Sem ");
      if (pa !== pb) return pa.localeCompare(pb);
      return Number(sa) - Number(sb);
    });
  }, [filtered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error("Course name and code are required");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Courses"
        description="Course catalog organized by program and semester"
        icon={BookOpen}
        action={<AddButton onClick={openCreate} label="Add Course" icon={BookPlus} />}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/60 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Select value={filterProgram} onValueChange={(v) => setFilterProgram(v as "all" | Program)}>
          <SelectTrigger className="w-full sm:w-44 bg-card/60">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="bsc">BSc Engineering</SelectItem>
            <SelectItem value="msc">MSc Engineering</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading courses…" />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          message={search ? "Try a different search." : "Add your first course to get started."}
        />
      ) : (
        <div className="space-y-3">
          {grouped.map(([groupKey, items]) => {
            const expanded = expandedGroup === groupKey || (!!search && search.length > 0);
            return (
              <motion.div
                key={groupKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-3d card-inner-glow overflow-hidden"
              >
                <div className="relative z-10">
                  <button
                    onClick={() => setExpandedGroup(expanded ? null : groupKey)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-semibold text-sm">{groupKey}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {items.length} course{items.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {items.filter((i) => i.type === "lab").length} lab ·{" "}
                      {items.filter((i) => i.type === "theory").length} theory
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40">
                              <TableHead className="pl-4">Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="hidden sm:table-cell">Type</TableHead>
                              <TableHead className="hidden sm:table-cell">Credits</TableHead>
                              <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((c, i) => (
                              <motion.tr
                                key={c.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                                className="hover:bg-muted/50 border-b transition-colors"
                              >
                                <TableCell className="pl-4">
                                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold">
                                    <Hash className="h-3 w-3 text-primary" />
                                    {c.code}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{c.name}</div>
                                    <div className="sm:hidden flex items-center gap-1.5 mt-0.5">
                                      <TypeBadge type={c.type} />
                                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5" /> {c.creditHours}cr
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <TypeBadge type={c.type} />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <span className="text-xs">{c.creditHours}</span>
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                  <RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} />
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {isEdit ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update course details. Changes propagate to schedules referencing this course."
                : "Add a new course to the catalog. Theory courses are teal, lab courses are amber."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Course Name" htmlFor="name" required>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Data Structures"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Course Code" htmlFor="code" required>
                <Input
                  id="code"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="CSE121"
                />
              </Field>
              <Field label="Credit Hours" htmlFor="creditHours" required>
                <Input
                  id="creditHours"
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={form.creditHours}
                  onChange={(e) => setForm({ ...form, creditHours: Number(e.target.value) })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Type" required>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as ClassType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Semester" required>
                <Select
                  value={String(form.semester)}
                  onValueChange={(v) => setForm({ ...form, semester: Number(v) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {semesterLabel(s)} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Program" required>
                <Select
                  value={form.program}
                  onValueChange={(v) => setForm({ ...form, program: v as Program })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <DialogFooter>
              <SubmitButton loading={mutation.isPending}>
                {isEdit ? "Save Changes" : "Create Course"}
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
        title="Delete course?"
        description="This permanently removes the course. Existing schedules referencing this course will remain but may show stale data."
      />
    </SectionShell>
  );
}
