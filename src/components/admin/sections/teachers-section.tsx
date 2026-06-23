"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Mail, Phone, MapPin, Briefcase, UserPlus, Search } from "lucide-react";
import { useRealtimeTeachers } from "@/hooks/use-realtime-data";
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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { User } from "@/types";

interface FormState {
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

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  designation: "Lecturer",
  phone: "",
  officeRoom: "",
  bio: "",
  password: "",
  pin: "",
};

export function TeachersSection({ autoOpenAddSignal }: { autoOpenAddSignal?: number }) {
  const { data: teachers, isLoading } = useRealtimeTeachers();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Auto-open form when signal increments
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

  const openEdit = (t: User) => {
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
    setIsEdit(true);
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const body = { ...data };
      if (isEdit) {
        // Remove empty password/pin on edit
        if (!body.password) delete body.password;
        if (!body.pin) delete body.pin;
        const res = await fetch("/api/teachers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
        return res.json();
      } else {
        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Teacher updated" : "Teacher added");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/teachers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Teacher deleted");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = React.useMemo(() => {
    if (!teachers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.designation || "").toLowerCase().includes(q) ||
        (t.officeRoom || "").toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error("Full name and email are required");
      return;
    }
    if (!isEdit && !form.password) {
      toast.error("Password is required for new teachers");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Teachers"
        description="Manage faculty accounts, contact info & access"
        icon={Users}
        action={<AddButton onClick={openCreate} label="Add Teacher" icon={UserPlus} />}
      />

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/60">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, designation…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {teachers && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {filtered.length}/{teachers.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading teachers…" />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teachers found"
          message={search ? "Try a different search." : "Add your first teacher to get started."}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card-3d card-inner-glow overflow-hidden">
            <div className="relative z-10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      className="hover:bg-muted/50 border-b transition-colors"
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {t.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{t.fullName}</div>
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
                              <Mail className="h-2.5 w-2.5" /> {t.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.designation ? (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {t.designation}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{t.phone || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{t.officeRoom || "—"}</span>
                      </TableCell>
                      <TableCell className="pr-4">
                        <RowActions onEdit={() => openEdit(t)} onDelete={() => setDeleteId(t.id)} />
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-2">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="card-3d card-inner-glow p-3"
              >
                <div className="relative z-10 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{t.fullName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{t.email}</div>
                      </div>
                      <RowActions onEdit={() => openEdit(t)} onDelete={() => setDeleteId(t.id)} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 truncate">
                        <Briefcase className="h-3 w-3 text-primary shrink-0" />
                        {t.designation || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        {t.officeRoom || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <Phone className="h-3 w-3 text-primary shrink-0" />
                        {t.phone || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {isEdit ? "Edit Teacher" : "Add New Teacher"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update faculty profile. Leave password/PIN blank to keep current values."
                : "Create a new teacher account. Default password is teacher123 if left blank."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name" htmlFor="fullName" required>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Dr. John Doe"
                />
              </Field>
              <Field label="Email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="johndoe@ice.ru.ac.bd"
                />
              </Field>
              <Field label="Designation" htmlFor="designation">
                <Input
                  id="designation"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="Professor / Lecturer"
                />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </Field>
              <Field label="Office Room" htmlFor="officeRoom">
                <Input
                  id="officeRoom"
                  value={form.officeRoom}
                  onChange={(e) => setForm({ ...form, officeRoom: e.target.value })}
                  placeholder="Room 301, 3rd Floor"
                />
              </Field>
              <Field label="PIN (6-digit)" htmlFor="pin" hint="Optional — for PIN login">
                <Input
                  id="pin"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                  placeholder="e.g. 123456"
                />
              </Field>
            </div>

            <Field label="Bio" htmlFor="bio">
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Short biography, research interests, etc."
                rows={3}
              />
            </Field>

            <Field
              label={isEdit ? "New Password (optional)" : "Password"}
              htmlFor="password"
              required={!isEdit}
              hint={isEdit ? "Leave blank to keep current password" : "Default: teacher123"}
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required={!isEdit}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            <DialogFooter>
              <SubmitButton loading={mutation.isPending}>
                {isEdit ? "Save Changes" : "Create Teacher"}
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
        title="Delete teacher?"
        description="This permanently removes the teacher account. Schedules referencing this teacher will remain but show as unassigned."
      />
    </SectionShell>
  );
}
