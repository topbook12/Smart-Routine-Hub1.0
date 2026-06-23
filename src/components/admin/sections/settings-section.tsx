"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Code,
  Info,
  Image as ImageIcon,
  PanelBottom,
  Share2,
  GripVertical,
} from "lucide-react";
import { useSettings } from "@/hooks/use-realtime-data";
import {
  SectionHeader,
  SectionShell,
  SubmitButton,
  LoadingState,
  Field,
} from "../shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/types";

export function SettingsSection() {
  const { data: loaded, isLoading } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = React.useState<SiteSettings>(DEFAULT_SETTINGS);

  React.useEffect(() => {
    if (loaded) setForm({ ...DEFAULT_SETTINGS, ...loaded });
  }, [loaded]);

  const mutation = useMutation({
    mutationFn: async (data: SiteSettings) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) return <LoadingState message="Loading settings…" />;

  return (
    <SectionShell>
      <SectionHeader
        title="Settings"
        description="Configure site branding, navigation, footer & social presence"
        icon={Settings}
      />

      <form onSubmit={handleSubmit} className="card-3d card-inner-glow p-4 sm:p-6">
        <div className="relative z-10">
          <Tabs defaultValue="general">
            <TabsList className="flex flex-wrap h-auto bg-muted/40 p-1 gap-1">
              <TabsTrigger value="general" className="gap-1.5 text-xs">
                <Info className="h-3.5 w-3.5" /> General
              </TabsTrigger>
              <TabsTrigger value="header" className="gap-1.5 text-xs">
                <ImageIcon className="h-3.5 w-3.5" /> Header
              </TabsTrigger>
              <TabsTrigger value="footer" className="gap-1.5 text-xs">
                <PanelBottom className="h-3.5 w-3.5" /> Footer
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" /> Social
              </TabsTrigger>
              <TabsTrigger value="developer" className="gap-1.5 text-xs">
                <Code className="h-3.5 w-3.5" /> Developer
              </TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Site Name" required>
                  <Input
                    value={form.siteName}
                    onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                    placeholder="Smart Routine Hub"
                  />
                </Field>
                <Field label="Site Tagline">
                  <Input
                    value={form.siteTagline}
                    onChange={(e) => setForm({ ...form, siteTagline: e.target.value })}
                    placeholder="ICE-RU Department Management System"
                  />
                </Field>
                <Field label="Department Name">
                  <Input
                    value={form.departmentName}
                    onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                  />
                </Field>
                <Field label="University Name">
                  <Input
                    value={form.universityName}
                    onChange={(e) => setForm({ ...form, universityName: e.target.value })}
                  />
                </Field>
                <Field label="Academic Session">
                  <Input
                    value={form.academicSession}
                    onChange={(e) => setForm({ ...form, academicSession: e.target.value })}
                    placeholder="Spring 2026"
                  />
                </Field>
                <Field label="Contact Email">
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </Field>
                <Field label="Contact Phone">
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="About Text">
                <Textarea
                  rows={4}
                  value={form.aboutText}
                  onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
                />
              </Field>
            </TabsContent>

            {/* Header */}
            <TabsContent value="header" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" /> Header Links
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Navigation items shown in the top bar.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      headerLinks: [...form.headerLinks, { label: "New Link", href: "/?view=home" }],
                    })
                  }
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                {form.headerLinks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No header links yet.</p>
                )}
                {form.headerLinks.map((link, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/40"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...form.headerLinks];
                        next[i] = { ...next[i], label: e.target.value };
                        setForm({ ...form, headerLinks: next });
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Href"
                      value={link.href}
                      onChange={(e) => {
                        const next = [...form.headerLinks];
                        next[i] = { ...next[i], href: e.target.value };
                        setForm({ ...form, headerLinks: next });
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm({
                          ...form,
                          headerLinks: form.headerLinks.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Footer */}
            <TabsContent value="footer" className="space-y-4 mt-4">
              <Field label="Footer Description">
                <Textarea
                  rows={3}
                  value={form.footerDescription}
                  onChange={(e) => setForm({ ...form, footerDescription: e.target.value })}
                />
              </Field>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <PanelBottom className="h-4 w-4 text-primary" /> Footer Quick Links
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Quick links shown in the footer.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      footerQuickLinks: [...form.footerQuickLinks, { label: "New Link", href: "/" }],
                    })
                  }
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
              </div>
              <div className="space-y-2">
                {form.footerQuickLinks.map((link, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/40"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...form.footerQuickLinks];
                        next[i] = { ...next[i], label: e.target.value };
                        setForm({ ...form, footerQuickLinks: next });
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Href"
                      value={link.href}
                      onChange={(e) => {
                        const next = [...form.footerQuickLinks];
                        next[i] = { ...next[i], href: e.target.value };
                        setForm({ ...form, footerQuickLinks: next });
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm({
                          ...form,
                          footerQuickLinks: form.footerQuickLinks.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Social */}
            <TabsContent value="social" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <Share2 className="h-4 w-4 text-primary" /> Social Media
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Social media links shown in footer.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      socialMedia: [...form.socialMedia, { name: "New", url: "https://", icon: "globe" }],
                    })
                  }
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                {form.socialMedia.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_140px_auto] gap-2 items-center p-2 rounded-lg border border-border bg-card/40"
                  >
                    <Input
                      placeholder="Name"
                      value={s.name}
                      onChange={(e) => {
                        const next = [...form.socialMedia];
                        next[i] = { ...next[i], name: e.target.value };
                        setForm({ ...form, socialMedia: next });
                      }}
                    />
                    <Input
                      placeholder="URL"
                      value={s.url}
                      onChange={(e) => {
                        const next = [...form.socialMedia];
                        next[i] = { ...next[i], url: e.target.value };
                        setForm({ ...form, socialMedia: next });
                      }}
                    />
                    <Select
                      value={s.icon}
                      onValueChange={(v) => {
                        const next = [...form.socialMedia];
                        next[i] = { ...next[i], icon: v };
                        setForm({ ...form, socialMedia: next });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="globe">Website</SelectItem>
                        <SelectItem value="mail">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm({
                          ...form,
                          socialMedia: form.socialMedia.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Developer */}
            <TabsContent value="developer" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Developer Name">
                  <Input
                    value={form.developerName}
                    onChange={(e) => setForm({ ...form, developerName: e.target.value })}
                  />
                </Field>
                <Field label="Developer URL">
                  <Input
                    value={form.developerUrl}
                    onChange={(e) => setForm({ ...form, developerUrl: e.target.value })}
                  />
                </Field>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border border-teal-500/20 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                  <Code className="h-3.5 w-3.5 text-primary" /> About this portal
                </p>
                These settings control global site configuration. Changes are immediately reflected
                across all pages (header, footer, social icons, developer credit).
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => loaded && setForm({ ...DEFAULT_SETTINGS, ...loaded })}
              disabled={mutation.isPending}
            >
              Reset
            </Button>
            <SubmitButton loading={mutation.isPending}>
              <Save className="h-4 w-4" /> Save Settings
            </SubmitButton>
          </div>
        </div>
      </form>
    </SectionShell>
  );
}
