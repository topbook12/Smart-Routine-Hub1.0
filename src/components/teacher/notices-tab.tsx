"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CalendarClock,
  FileText,
  Loader2,
  Pin,
  PinOff,
  Trash2,
  AlertCircle,
  PartyPopper,
  GraduationCap,
} from "lucide-react";
import { useRealtimeNotices } from "@/hooks/use-realtime-data";
import type { Notice, NoticeCategory } from "@/types";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Props {
  userId: string;
  userName: string;
}

const CATEGORIES: {
  value: NoticeCategory;
  label: string;
  icon: typeof Bell;
  color: string;
  bg: string;
}[] = [
  { value: "academic", label: "Academic", icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  { value: "exam", label: "Exam", icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  { value: "event", label: "Event", icon: PartyPopper, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10" },
  { value: "general", label: "General", icon: Bell, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10" },
  { value: "schedule_change", label: "Schedule", icon: CalendarClock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
];

export function NoticesTab({ userId, userName }: Props) {
  const { data: notices, isLoading } = useRealtimeNotices({ limit: 100 });

  const myNotices = useMemo(() => {
    if (!notices) return [];
    return notices
      .filter((n) => n.postedById === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notices, userId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Create form */}
      <div className="lg:col-span-2">
        <CreateNoticeForm userId={userId} userName={userName} />
      </div>

      {/* My notices */}
      <div className="lg:col-span-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-3d p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> My Notices
            </h3>
            <Badge variant="outline" className="text-[10px] h-5">
              {myNotices.length} posted
            </Badge>
          </div>

          {isLoading ? (
            <LoadingState message="Loading your notices…" className="py-8" />
          ) : myNotices.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notices yet"
              message="Use the form on the left to post your first notice. It will appear instantly for students."
              className="py-8"
            />
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto scrollbar-premium pr-1">
              {myNotices.map((n, i) => (
                <MyNoticeRow key={n.id} notice={n} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function CreateNoticeForm({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("general");
  const [isPinned, setIsPinned] = useState(false);

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to post notice");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Notice posted", {
        description: "Your notice is now live for everyone.",
      });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setTitle("");
      setContent("");
      setCategory("general");
      setIsPinned(false);
    },
    onError: () => toast.error("Failed to post notice. Please try again."),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
      isPinned,
      postedById: userId,
      postedByName: userName,
    });
  };

  const cat = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[3];

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className="card-3d p-4 space-y-3.5 sticky top-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-teal-glow">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Post a Notice</h3>
          <p className="text-[11px] text-muted-foreground">
            Visible to all students &amp; teachers
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="notice-title" className="text-xs">
          Title
        </Label>
        <Input
          id="notice-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Class test on Friday"
          className="mt-1.5 h-9"
          maxLength={120}
          required
        />
      </div>

      <div>
        <Label htmlFor="notice-content" className="text-xs">
          Content
        </Label>
        <Textarea
          id="notice-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your notice details here…"
          className="mt-1.5 min-h-[110px] resize-none"
          maxLength={1500}
          required
        />
      </div>

      <div>
        <Label className="text-xs">Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as NoticeCategory)}
        >
          <SelectTrigger className="mt-1.5 h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <c.icon className={cn("h-3.5 w-3.5", c.color)} />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
        <div className="flex items-center gap-2">
          <Pin className={cn("h-4 w-4", isPinned ? "text-amber-500" : "text-muted-foreground")} />
          <div>
            <p className="text-xs font-medium">Pin this notice</p>
            <p className="text-[10px] text-muted-foreground">
              Pinned notices appear at the top
            </p>
          </div>
        </div>
        <Switch checked={isPinned} onCheckedChange={setIsPinned} />
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full h-10 gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white btn-3d shadow-teal-glow"
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <cat.icon className={cn("h-4 w-4", cat.color)} />
        )}
        {mutation.isPending ? "Posting…" : "Post Notice"}
      </Button>
    </motion.form>
  );
}

function MyNoticeRow({ notice, index }: { notice: Notice; index: number }) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cat = CATEGORIES.find((c) => c.value === notice.category) ?? CATEGORIES[3];

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notices?id=${notice.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Notice deleted");
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setConfirmOpen(false);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to delete notice"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -1 }}
      className={cn(
        "rounded-xl border p-3 transition-colors",
        notice.isPinned
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-border bg-card/60"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center",
            cat.bg
          )}
        >
          <cat.icon className={cn("h-4 w-4", cat.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {notice.isPinned && (
              <Pin className="h-3 w-3 text-amber-500 shrink-0" />
            )}
            <h4 className="font-semibold text-sm line-clamp-1">{notice.title}</h4>
            <Badge variant="outline" className="text-[9px] h-4 uppercase">
              {cat.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {notice.content}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
            {notice.isAutoGenerated && " · auto-generated"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete notice"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <PinOff className="h-4 w-4 text-amber-500" />
              Delete notice?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notice &ldquo;{notice.title}&rdquo; will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
