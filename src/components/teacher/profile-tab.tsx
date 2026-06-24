"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Mail, Phone, MapPin, User2, FileText, Lock, Save, Eye, EyeOff } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-realtime-data";
import { SectionHeader } from "@/components/admin/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ProfileTab({ userId }: { userId: string }) {
  void userId;
  const qc = useQueryClient();
  const { data: userResp } = useCurrentUser();
  const [form, setForm] = useState({
    fullName: userResp?.user?.fullName ?? "",
    designation: userResp?.user?.designation ?? "",
    department: userResp?.user?.department ?? "",
    phone: userResp?.user?.phone ?? "",
    officeRoom: userResp?.user?.officeRoom ?? "",
    bio: userResp?.user?.bio ?? "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const save = async () => {
    if (!form.fullName) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        designation: form.designation,
        department: form.department,
        phone: form.phone,
        officeRoom: form.officeRoom,
        bio: form.bio,
      };
      if (form.password) body.password = form.password;
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Save failed");
      }
      await qc.invalidateQueries({ queryKey: ["current-user"] });
      await qc.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Profile updated successfully");
      setForm((f) => ({ ...f, password: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="My Profile"
        description="Update your personal information, contact details and password."
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d card-inner-glow p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="h-14 w-14 rounded-lg bg-ink flex items-center justify-center text-white font-bold text-xl shrink-0">
            {(form.fullName || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-base">{form.fullName || "Your name"}</p>
            <p className="text-xs text-muted-foreground">{userResp?.user?.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Full Name *</Label>
            <div className="relative mt-1.5">
              <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="pl-9 h-10" placeholder="Dr. John Doe" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Designation</Label>
            <div className="relative mt-1.5">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="pl-9 h-10" placeholder="Professor" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Department</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-1.5 h-10" placeholder="ICE, RU" />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pl-9 h-10" placeholder="+880…" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Office Room</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.officeRoom} onChange={(e) => setForm({ ...form, officeRoom: e.target.value })} className="pl-9 h-10" placeholder="Room 101" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Email (read-only)</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={userResp?.user?.email ?? ""} disabled className="pl-9 h-10 bg-muted/50" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Bio</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1.5" rows={3} placeholder="Short professional bio…" />
        </div>

        <div className="pt-4 border-t border-border/60">
          <Label className="text-xs flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Change Password (leave blank to keep current)</Label>
          <div className="relative mt-1.5 max-w-sm">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-9 pr-10 h-10"
              placeholder="New password"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving} className="btn-3d btn-ink gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
