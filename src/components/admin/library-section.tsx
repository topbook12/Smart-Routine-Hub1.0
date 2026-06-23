"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Library as LibraryIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

interface LibLink {
  id: string;
  degree: string;
  semester: number | null;
  url: string;
  title: string;
  isActive: boolean;
}

interface LibForm {
  id?: string;
  degree: "bsc" | "msc" | "others";
  semester: string;
  url: string;
  title: string;
  isActive: boolean;
}

const EMPTY: LibForm = { degree: "bsc", semester: "1", url: "", title: "", isActive: true };

const DEGREE_STYLES: Record<string, string> = {
  bsc: "from-teal-500 to-emerald-500",
  msc: "from-amber-500 to-orange-500",
  others: "from-violet-500 to-purple-500",
};

export function LibrarySection() {
  const qc = useQueryClient();
  const { data: links, isLoading } = useQuery<LibLink[]>({
    queryKey: ["library-links"],
    queryFn: async () => {
      const r = await fetch("/api/library-links");
      return r.json();
    },
    staleTime: 10_000,
  });
  const mutation = useAdminMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LibForm>(EMPTY);

  const openAdd = () => { setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (l: LibLink) => {
    setForm({ id: l.id, degree: l.degree as LibForm["degree"], semester: l.semester ? String(l.semester) : "", url: l.url, title: l.title, isActive: l.isActive });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.url || !form.title) { toast.error("URL and title are required"); return; }
    const body = {
      degree: form.degree,
      semester: form.degree === "others" ? null : Number(form.semester) || null,
      url: form.url,
      title: form.title,
      isActive: form.isActive,
    };
    mutation.mutate({
      method: form.id ? "PUT" : "POST",
      url: "/api/library-links",
      body: form.id ? { id: form.id, ...body } : body,
      successMsg: form.id ? "Link updated" : "Link added",
      invalidateKeys: [["library-links"]],
    }, { onSettled: () => setDialogOpen(false) });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate({
      method: "DELETE",
      url: `/api/library-links?id=${deleteId}`,
      successMsg: "Link removed",
      invalidateKeys: [["library-links"]],
    }, { onSettled: () => setDeleteId(null) });
  };

  const grouped: Record<string, LibLink[]> = { bsc: [], msc: [], others: [] };
  links?.forEach((l) => { (grouped[l.degree] ||= []).push(l); });

  return (
    <div>
      <SectionHeader
        title="Library Links"
        description="Google Drive resource links organised by degree and semester."
        icon={LibraryIcon}
        badge={links?.length ?? 0}
        action={
          <Button onClick={openAdd} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Link
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading links…" />
      ) : !links || links.length === 0 ? (
        <EmptyState icon={LibraryIcon} title="No library links" message="Add your first Google Drive link." />
      ) : (
        <div className="space-y-5">
          {(["bsc", "msc", "others"] as const).map((deg) => {
            const items = grouped[deg];
            if (!items || items.length === 0) return null;
            return (
              <div key={deg}>
                <h3 className="font-semibold text-sm mb-2 uppercase text-muted-foreground">
                  {deg === "bsc" ? "B.Sc." : deg === "msc" ? "M.Sc." : "Others"} ({items.length})
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((l, i) => (
                    <motion.div
                      key={l.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      whileHover={{ y: -3 }}
                      className="card-3d card-inner-glow p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0", DEGREE_STYLES[deg])}>
                          {l.semester ?? "★"}
                        </div>
                        {l.isActive ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600">active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">hidden</Badge>
                        )}
                      </div>
                      <p className="font-semibold text-sm line-clamp-1">{l.title}</p>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 truncate">
                        <ExternalLink className="h-3 w-3" /> Open Drive
                      </a>
                      <div className="flex gap-1.5 mt-3">
                        <Button size="sm" variant="outline" onClick={() => openEdit(l)} className="h-7 text-xs gap-1 flex-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(l.id)} className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Link" : "Add Link"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Degree</Label>
                <Select value={form.degree} onValueChange={(v) => setForm({ ...form, degree: v as LibForm["degree"] })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Semester</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={form.semester}
                  disabled={form.degree === "others"}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="mt-1 h-10"
                  placeholder={form.degree === "others" ? "N/A" : "1-8"}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 h-10" placeholder="B.Sc. — 1st Semester" />
            </div>
            <div>
              <Label className="text-xs">Google Drive URL *</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1 h-10" placeholder="https://drive.google.com/..." />
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border">
              <Label className="text-xs">Active (visible to students)</Label>
              <Switch checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
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
            <AlertDialogTitle>Delete link?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the library resource link.</AlertDialogDescription>
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
