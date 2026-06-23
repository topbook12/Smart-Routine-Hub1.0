"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Pin, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeNotices } from "@/hooks/use-realtime-data";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { SectionHeader } from "@/components/admin/section-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

interface NoticeForm {
  title: string;
  content: string;
  category: "academic" | "exam" | "event" | "general" | "schedule_change";
  isPinned: boolean;
  affectedSemester: string;
  affectedProgram: string;
}

const EMPTY: NoticeForm = {
  title: "",
  content: "",
  category: "general",
  isPinned: false,
  affectedSemester: "",
  affectedProgram: "",
};

const CAT_STYLES: Record<string, string> = {
  academic: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  exam: "bg-red-500/15 text-red-700 dark:text-red-300",
  event: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  general: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  schedule_change: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function NoticesSection() {
  const { data: notices, isLoading } = useRealtimeNotices({ limit: 100 });
  const mutation = useAdminMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<NoticeForm>(EMPTY);

  const openAdd = () => { setForm(EMPTY); setDialogOpen(true); };

  const save = () => {
    if (!form.title || !form.content) return;
    mutation.mutate({
      method: "POST",
      url: "/api/notices",
      body: {
        title: form.title,
        content: form.content,
        category: form.category,
        isPinned: form.isPinned,
        affectedSemester: form.affectedSemester ? Number(form.affectedSemester) : null,
        affectedProgram: form.affectedProgram || null,
      },
      successMsg: "Notice posted",
    }, { onSettled: () => setDialogOpen(false) });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    mutation.mutate({ method: "DELETE", url: `/api/notices?id=${deleteId}`, successMsg: "Notice removed" }, {
      onSettled: () => setDeleteId(null),
    });
  };

  // sort: pinned first, then newest
  const sorted = [...(notices ?? [])].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      <SectionHeader
        title="Notices"
        description="Publish announcements, exam schedules and event notices."
        icon={Bell}
        badge={notices?.length ?? 0}
        action={
          <Button onClick={openAdd} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Plus className="h-4 w-4" /> New Notice
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading notices…" />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Bell} title="No notices" message="Post your first notice." />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className="card-3d p-4"
            >
              <div className="flex items-start gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", CAT_STYLES[n.category])}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {n.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <Badge variant="outline" className={cn("text-[10px] capitalize", CAT_STYLES[n.category])}>{n.category}</Badge>
                    {n.isAutoGenerated && <Badge variant="outline" className="text-[10px]">auto</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {n.affectedProgram && <span className="text-[10px] text-muted-foreground uppercase">{n.affectedProgram}</span>}
                    {n.affectedSemester && <span className="text-[10px] text-muted-foreground">Sem {n.affectedSemester}</span>}
                    <span className="text-[10px] text-muted-foreground">
                      {n.postedByName} · {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(n.id)} className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Notice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 h-10" placeholder="Mid-term exam schedule" />
            </div>
            <div>
              <Label className="text-xs">Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1" rows={4} placeholder="Notice details…" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NoticeForm["category"] })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="schedule_change">Schedule Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Affected Program (optional)</Label>
                <Select value={form.affectedProgram || "none"} onValueChange={(v) => setForm({ ...form, affectedProgram: v === "none" ? "" : v })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <Label className="text-xs">Affected Semester (optional)</Label>
                <Input type="number" min={1} max={8} value={form.affectedSemester} onChange={(e) => setForm({ ...form, affectedSemester: e.target.value })} className="mt-1 h-10" placeholder="e.g. 5" />
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border">
                <Label className="text-xs flex items-center gap-1"><Pin className="h-3 w-3 text-amber-500" /> Pin to top</Label>
                <Switch checked={form.isPinned} onCheckedChange={(c) => setForm({ ...form, isPinned: c })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={mutation.isPending} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
              {mutation.isPending ? "Posting…" : "Post Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notice?</AlertDialogTitle>
            <AlertDialogDescription>This notice will be removed permanently.</AlertDialogDescription>
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
