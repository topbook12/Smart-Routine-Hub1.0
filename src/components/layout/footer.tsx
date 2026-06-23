"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Code, Facebook, Globe, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  globe: Globe,
  mail: Mail,
};

export function Footer() {
  const settings = useSettingsStore((s) => s.settings);
  const pathname = usePathname();
  // Hide footer on dashboard routes (they manage their own layout)
  if (pathname.startsWith("/admin") || pathname.startsWith("/teacher") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <footer className="mt-auto relative overflow-hidden border-t border-border/60 bg-gradient-to-b from-transparent to-muted/40">
      <div className="absolute inset-0 hero-bg opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-12 pb-24 lg:pb-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-teal-glow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-gradient-primary">{settings.siteName}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{settings.academicSession}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{settings.footerDescription}</p>
            <div className="flex items-center gap-2 mt-4">
              {settings.socialMedia.map((s) => {
                const Icon = SOCIAL_ICONS[s.icon] ?? Globe;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:shadow-sm transition-all"
                    aria-label={s.name}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            <h3 className="font-semibold text-sm mb-3 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {settings.footerQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Department */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-sm mb-3 text-foreground">Department</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2 font-medium">{settings.departmentName}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{settings.universityName}</p>
            <ul className="space-y-2 mt-3">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{settings.contactPhone}</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{settings.contactEmail}</span>
              </li>
            </ul>
          </motion.div>

          {/* Developer */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-semibold text-sm mb-3 text-foreground">About this Portal</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {settings.aboutText}
            </p>
            <a
              href={settings.developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Code className="h-3.5 w-3.5" />
              Developed by {settings.developerName}
            </a>
          </motion.div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} {settings.departmentName}, {settings.universityName}. All rights reserved.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Real-time updates &middot; {settings.academicSession}
          </p>
        </div>
      </div>
    </footer>
  );
}
