"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Link2, Plus, Save, Settings as SettingsIcon, Trash2, User2 } from "lucide-react";
import { useSettings } from "@/hooks/use-realtime-data";
import { useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/admin/section-header";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/types";

export function SettingsSection() {
  const { data: loaded, isLoading } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) setForm({ ...DEFAULT_SETTINGS, ...loaded });
  }, [loaded]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading settings…" />;

  // Helpers for dynamic lists
  const updateHeaderLink = (i: number, field: "label" | "href", v: string) => {
    const next = [...form.headerLinks];
    next[i] = { ...next[i], [field]: v };
    setForm({ ...form, headerLinks: next });
  };
  const addHeaderLink = () => setForm({ ...form, headerLinks: [...form.headerLinks, { label: "New Link", href: "/" }] });
  const removeHeaderLink = (i: number) => setForm({ ...form, headerLinks: form.headerLinks.filter((_, idx) => idx !== i) });

  const updateFooterLink = (i: number, field: "label" | "href", v: string) => {
    const next = [...form.footerQuickLinks];
    next[i] = { ...next[i], [field]: v };
    setForm({ ...form, footerQuickLinks: next });
  };
  const addFooterLink = () => setForm({ ...form, footerQuickLinks: [...form.footerQuickLinks, { label: "New Link", href: "/" }] });
  const removeFooterLink = (i: number) => setForm({ ...form, footerQuickLinks: form.footerQuickLinks.filter((_, idx) => idx !== i) });

  const updateSocial = (i: number, field: "name" | "url" | "icon", v: string) => {
    const next = [...form.socialMedia];
    next[i] = { ...next[i], [field]: v };
    setForm({ ...form, socialMedia: next });
  };
  const addSocial = () => setForm({ ...form, socialMedia: [...form.socialMedia, { name: "New", url: "https://", icon: "globe" }] });
  const removeSocial = (i: number) => setForm({ ...form, socialMedia: form.socialMedia.filter((_, idx) => idx !== i) });

  return (
    <div>
      <SectionHeader
        title="Site Settings"
        description="Configure site branding, navigation, footer and developer info."
        icon={SettingsIcon}
        action={
          <Button onClick={save} disabled={saving} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 text-white gap-1.5">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
          <TabsTrigger value="header" className="text-xs">Header</TabsTrigger>
          <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          <TabsTrigger value="developer" className="text-xs">Developer</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Site Name</Label>
                <Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs">Academic Session</Label>
                <Input value={form.academicSession} onChange={(e) => setForm({ ...form, academicSession: e.target.value })} className="mt-1 h-10" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Site Tagline</Label>
              <Input value={form.siteTagline} onChange={(e) => setForm({ ...form, siteTagline: e.target.value })} className="mt-1 h-10" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Department Name</Label>
                <Input value={form.departmentName} onChange={(e) => setForm({ ...form, departmentName: e.target.value })} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs">University Name</Label>
                <Input value={form.universityName} onChange={(e) => setForm({ ...form, universityName: e.target.value })} className="mt-1 h-10" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contact Email</Label>
                <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-1 h-10" />
              </div>
              <div>
                <Label className="text-xs">Contact Phone</Label>
                <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="mt-1 h-10" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-xs">About Text</Label>
              <Textarea value={form.aboutText} onChange={(e) => setForm({ ...form, aboutText: e.target.value })} className="mt-1" rows={3} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Header Links */}
        <TabsContent value="header" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">Header Navigation Links</h3>
                <p className="text-xs text-muted-foreground">Links shown in the desktop top navigation.</p>
              </div>
              <Button size="sm" variant="outline" onClick={addHeaderLink} className="gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {form.headerLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={link.label} onChange={(e) => updateHeaderLink(i, "label", e.target.value)} className="h-9 text-xs w-1/3" placeholder="Label" />
                  <Input value={link.href} onChange={(e) => updateHeaderLink(i, "href", e.target.value)} className="h-9 text-xs flex-1" placeholder="/?view=..." />
                  <Button size="sm" variant="ghost" onClick={() => removeHeaderLink(i)} className="h-9 w-9 p-0 text-red-600 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {form.headerLinks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No header links yet.</p>}
            </div>
          </motion.div>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-5 space-y-4">
            <div>
              <Label className="text-xs">Footer Description</Label>
              <Textarea value={form.footerDescription} onChange={(e) => setForm({ ...form, footerDescription: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Footer Quick Links</h4>
                <Button size="sm" variant="outline" onClick={addFooterLink} className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {form.footerQuickLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={link.label} onChange={(e) => updateFooterLink(i, "label", e.target.value)} className="h-9 text-xs w-1/3" placeholder="Label" />
                    <Input value={link.href} onChange={(e) => updateFooterLink(i, "href", e.target.value)} className="h-9 text-xs flex-1" placeholder="URL" />
                    <Button size="sm" variant="ghost" onClick={() => removeFooterLink(i)} className="h-9 w-9 p-0 text-red-600 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">Social Media Links</h3>
                <p className="text-xs text-muted-foreground">Icon options: facebook, globe, mail</p>
              </div>
              <Button size="sm" variant="outline" onClick={addSocial} className="gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {form.socialMedia.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <Input value={s.name} onChange={(e) => updateSocial(i, "name", e.target.value)} className="h-9 text-xs" placeholder="Name" />
                  <Input value={s.url} onChange={(e) => updateSocial(i, "url", e.target.value)} className="h-9 text-xs" placeholder="https://..." />
                  <div className="flex gap-1">
                    <Input value={s.icon} onChange={(e) => updateSocial(i, "icon", e.target.value)} className="h-9 text-xs" placeholder="globe" />
                    <Button size="sm" variant="ghost" onClick={() => removeSocial(i)} className="h-9 w-9 p-0 text-red-600 hover:bg-red-500/10 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Developer */}
        <TabsContent value="developer" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-5 space-y-3">
            <div>
              <Label className="text-xs">Developer Name</Label>
              <Input value={form.developerName} onChange={(e) => setForm({ ...form, developerName: e.target.value })} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-xs">Developer URL</Label>
              <Input value={form.developerUrl} onChange={(e) => setForm({ ...form, developerUrl: e.target.value })} className="mt-1 h-10" />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
