"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Plus, Link2, ExternalLink, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { semesterLabel, type LibraryLink } from "@/types";

type Degree = "bsc" | "msc" | "others";

interface FormState {
  id?: string;
  degree: Degree;
  semester: string;
  url: string;
  title: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  degree: "bsc",
  semester: "1",
  url: "",
  title: "",
  isActive: true,
};

const DEGREE_LABEL: Record<Degree, string> = {
  bsc: "BSc Engineering",
  msc: "MSc Engineering",
  others: "Others",
};

const DEGREE_BADGE: Record<Degree, string> = {
  bsc: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  msc: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  others: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

function useRealtimeLibraryLinks() {
  return useQuery<LibraryLink[]>({
    queryKey: ["library-links"],
    queryFn: async () => {
      const res = await fetch("/api/library-links");
      if (!res.ok) throw new Error("Failed to fetch library links");
      return res.json();
    },
    refetchInterval: 10000,
    staleTime: 8000,
  });
}

export function LibrarySection({ autoOpenAddSignal }: { autoOpenAddSignal?: number }) {
  const { data: links, isLoading } = useRealtimeLibraryLinks();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({ bsc: true });

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

  const openEdit = (l: LibraryLink) => {
    setForm({
      id: l.id,
      degree: l.degree,
      semester: l.semester ? String(l.semester) : "",
      url: l.url,
      title: l.title,
      isActive: l.isActive,
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const body = {
        degree: data.degree,
        semester: data.degree === "others" ? null : data.semester ? Number(data.semester) : null,
        url: data.url,
        title: data.title,
        isActive: data.isActive,
      };
      if (isEdit && data.id) {
        const res = await fetch("/api/library-links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id, ...body }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
        return res.json();
      } else {
        const res = await fetch("/api/library-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Library link updated" : "Library link added");
      qc.invalidateQueries({ queryKey: ["library-links"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library-links?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Library link deleted");
      qc.invalidateQueries({ queryKey: ["library-links"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = React.useMemo(() => {
    const m = new Map<Degree, LibraryLink[]>();
    for (const l of links || []) {
      if (!m.has(l.degree)) m.set(l.degree, []);
      m.get(l.degree)!.push(l);
    }
    // Sort within group: by semester asc
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => (a.semester || 99) - (b.semester || 99));
      m.set(k, arr);
    }
    const order: Degree[] = ["bsc", "msc", "others"];
    return order
      .filter((d) => m.has(d))
      .map((d) => [d, m.get(d)!] as [Degree, LibraryLink[]]);
  }, [links]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url || !form.title) {
      toast.error("Title and URL are required");
      return;
    }
    if (form.degree !== "others" && !form.semester) {
      toast.error("Semester is required for BSc/MSc");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Library"
        description="Google Drive resource links organized by degree & semester"
        icon={Library}
        action={<AddButton onClick={openCreate} label="Add Link" icon={Plus} />}
      />

      {isLoading ? (
        <LoadingState message="Loading library links…" />
      ) : !links || links.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No library links yet"
          message="Add your first Google Drive resource link to get started."
        />
      ) : (
        <div className="space-y-3">
          {grouped.map(([degree, items]) => {
            const isOpen = expanded[degree] !== false;
            return (
              <motion.div
                key={degree}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-3d card-inner-glow overflow-hidden"
              >
                <div className="relative z-10">
                  <button
                    onClick={() => setExpanded((s) => ({ ...s, [degree]: !isOpen }))}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${DEGREE_BADGE[degree]}`}>
                        {DEGREE_LABEL[degree]}
                      </span>
                      <span className="font-semibold text-sm">{items.length} link{items.length === 1 ? "" : "s"}</span>
                    </div>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2">
                          {items.map((l, i) => (
                            <motion.div
                              key={l.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(i * 0.03, 0.3) }}
                              className="p-3 rounded-lg bg-card/60 border border-border hover:border-primary/30 transition-colors group"
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0">
                                  <Link2 className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    {l.semester ? (
                                      <Badge variant="outline" className="text-[10px]">
                                        {semesterLabel(l.semester)} Semester
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">
                                        General
                                      </Badge>
                                    )}
                                    {!l.isActive && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm font-medium truncate">{l.title}</div>
                                  <a
                                    href={l.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5 truncate max-w-full"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">{l.url}</span>
                                  </a>
                                </div>
                                <div className="shrink-0">
                                  <RowActions onEdit={() => openEdit(l)} onDelete={() => setDeleteId(l.id)} />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
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
              <Library className="h-4 w-4 text-primary" />
              {isEdit ? "Edit Library Link" : "Add Library Link"}
            </DialogTitle>
            <DialogDescription>
              Google Drive links to course materials, organized by degree & semester.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Degree" required>
                <Select
                  value={form.degree}
                  onValueChange={(v) => setForm({ ...form, degree: v as Degree })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc Engineering</SelectItem>
                    <SelectItem value="msc">MSc Engineering</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.degree !== "others" && (
                <Field label="Semester" required>
                  <Select
                    value={form.semester}
                    onValueChange={(v) => setForm({ ...form, semester: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select semester" />
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
              )}
            </div>

            <Field label="Title" htmlFor="title" required>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Semester 1 — All Course Materials"
              />
            </Field>

            <Field label="URL" htmlFor="url" required>
              <Input
                id="url"
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://drive.google.com/…"
              />
            </Field>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60">
              <div>
                <div className="text-sm font-medium">Active</div>
                <p className="text-[10px] text-muted-foreground">Inactive links are hidden from public view.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>

            <DialogFooter>
              <SubmitButton loading={mutation.isPending}>
                {isEdit ? "Save Changes" : "Create Link"}
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
        title="Delete library link?"
        description="This permanently removes the resource link."
      />
    </SectionShell>
  );
}
