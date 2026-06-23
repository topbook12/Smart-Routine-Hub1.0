"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Plus, Pin, Clock, Search, Megaphone, GraduationCap } from "lucide-react";
import { useRealtimeNotices } from "@/hooks/use-realtime-data";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { semesterLabel, type Notice, type NoticeCategory } from "@/types";

const CATEGORY_COLORS: Record<NoticeCategory, string> = {
  academic: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  exam: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  event: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  general: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  schedule_change: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
};

const CATEGORY_ICONS: Record<NoticeCategory, React.ComponentType<{ className?: string }>> = {
  academic: GraduationCap,
  exam: Megaphone,
  event: Bell,
  general: Bell,
  schedule_change: Clock,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface FormState {
  id?: string;
  title: string;
  content: string;
  category: NoticeCategory;
  isPinned: boolean;
  affectedSemester: string;
  affectedProgram: "all" | "bsc" | "msc";
}

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  category: "general",
  isPinned: false,
  affectedSemester: "",
  affectedProgram: "all",
};

export function NoticesSection({ autoOpenAddSignal }: { autoOpenAddSignal?: number }) {
  const { data: notices, isLoading } = useRealtimeNotices({ limit: 100 });
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [filterCategory, setFilterCategory] = React.useState<"all" | NoticeCategory>("all");
  const [search, setSearch] = React.useState("");

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

  const openEdit = (n: Notice) => {
    setForm({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      isPinned: n.isPinned,
      affectedSemester: n.affectedSemester ? String(n.affectedSemester) : "",
      affectedProgram: (n.affectedProgram as "bsc" | "msc") || "all",
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const body = {
        title: data.title,
        content: data.content,
        category: data.category,
        isPinned: data.isPinned,
        affectedSemester: data.affectedSemester ? Number(data.affectedSemester) : null,
        affectedProgram: data.affectedProgram === "all" ? null : data.affectedProgram,
      };
      if (isEdit && data.id) {
        const res = await fetch("/api/notices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id, ...body }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
        return res.json();
      } else {
        const res = await fetch("/api/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Notice updated" : "Notice posted");
      qc.invalidateQueries({ queryKey: ["notices"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Notice deleted");
      qc.invalidateQueries({ queryKey: ["notices"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = React.useMemo(() => {
    if (!notices) return [];
    const q = search.trim().toLowerCase();
    return notices.filter((n) => {
      if (filterCategory !== "all" && n.category !== filterCategory) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });
  }, [notices, search, filterCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Title and content are required");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Notices"
        description="Post announcements, exam notices & schedule changes"
        icon={Bell}
        action={<AddButton onClick={openCreate} label="Post Notice" icon={Plus} />}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/60 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={(v) => setFilterCategory(v as "all" | NoticeCategory)}
        >
          <SelectTrigger className="w-full sm:w-44 bg-card/60">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="schedule_change">Schedule Change</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading notices…" />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices found"
          message={search || filterCategory !== "all" ? "Try a different filter." : "Post your first notice to get started."}
        />
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-premium pr-1">
          {filtered.map((n, i) => {
            const Icon = CATEGORY_ICONS[n.category];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                whileHover={{ y: -2 }}
                className={`card-3d card-inner-glow p-3 sm:p-4 ${n.isPinned ? "border-amber-500/40" : ""}`}
              >
                <div className="relative z-10 flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      n.isPinned
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-glow"
                        : "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-teal-glow"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {n.isPinned && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Pin className="h-2.5 w-2.5 fill-current" /> Pinned
                            </span>
                          )}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_COLORS[n.category]}`}>
                            {n.category.replace("_", " ")}
                          </span>
                          {n.affectedProgram && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              {n.affectedProgram.toUpperCase()}
                              {n.affectedSemester ? ` · Sem ${n.affectedSemester}` : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1">{n.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.content}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.postedByName && (
                            <span className="inline-flex items-center gap-0.5">
                              · by {n.postedByName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <RowActions onEdit={() => openEdit(n)} onDelete={() => setDeleteId(n.id)} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              {isEdit ? "Edit Notice" : "Post New Notice"}
            </DialogTitle>
            <DialogDescription>
              Notices are immediately published to all users (students, teachers, public visitors).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Title" htmlFor="title" required>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Midterm Exam Schedule Released"
              />
            </Field>

            <Field label="Content" htmlFor="content" required>
              <Textarea
                id="content"
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the full notice content…"
                rows={5}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Category" required>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as NoticeCategory })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="schedule_change">Schedule Change</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Affected Program">
                <Select
                  value={form.affectedProgram}
                  onValueChange={(v) => setForm({ ...form, affectedProgram: v as "all" | "bsc" | "msc" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="bsc">BSc only</SelectItem>
                    <SelectItem value="msc">MSc only</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Affected Semester" hint="Optional 1-8">
                <Select
                  value={form.affectedSemester}
                  onValueChange={(v) => setForm({ ...form, affectedSemester: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All semesters</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {semesterLabel(s)} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60">
              <div>
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5 text-amber-500" />
                  Pin this notice
                </div>
                <p className="text-[10px] text-muted-foreground">Pinned notices appear at the top of the list.</p>
              </div>
              <Switch
                checked={form.isPinned}
                onCheckedChange={(v) => setForm({ ...form, isPinned: v })}
              />
            </div>

            <DialogFooter>
              <SubmitButton loading={mutation.isPending}>
                {isEdit ? "Save Changes" : "Publish Notice"}
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
        title="Delete notice?"
        description="This permanently removes the notice. Any auto-generated schedule change notices may regenerate."
      />
    </SectionShell>
  );
}
