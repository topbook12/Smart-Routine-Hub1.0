"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MapPin,
  CalendarDays,
  Bell,
  AlertCircle,
  UserPlus,
  BookPlus,
  CalendarPlus,
  BellPlus,
  Pin,
  Clock,
} from "lucide-react";
import { useRealtimeStats, useRealtimeNotices } from "@/hooks/use-realtime-data";
import { StatCard, LoadingState, EmptyState } from "@/components/shared/states";
import { SectionHeader, SectionShell } from "../shared";
import { Badge } from "@/components/ui/badge";
import type { AdminSection } from "../admin-sidebar";

const CATEGORY_COLORS: Record<string, string> = {
  academic: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  exam: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  event: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  general: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  schedule_change: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
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

export function DashboardOverview({ onNavigate }: { onNavigate: (s: AdminSection) => void }) {
  const { data: stats, isLoading } = useRealtimeStats();
  const { data: notices, isLoading: noticesLoading } = useRealtimeNotices({ limit: 5 });

  const quickActions = [
    { label: "Add Teacher", icon: UserPlus, target: "teachers" as AdminSection, color: "from-teal-500 to-emerald-500" },
    { label: "Add Course", icon: BookPlus, target: "courses" as AdminSection, color: "from-cyan-500 to-teal-500" },
    { label: "Add Schedule", icon: CalendarPlus, target: "schedules" as AdminSection, color: "from-amber-500 to-orange-500" },
    { label: "Post Notice", icon: BellPlus, target: "notices" as AdminSection, color: "from-orange-500 to-red-500" },
  ];

  return (
    <SectionShell>
      <SectionHeader
        title="Dashboard Overview"
        description="Real-time pulse of your academic portal"
        icon={LayoutDashboard}
      />

      {isLoading ? (
        <LoadingState message="Loading stats…" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Teachers" value={stats?.teachers ?? 0} icon={Users} variant="teal" index={0} />
          <StatCard label="Active Courses" value={stats?.courses ?? 0} icon={BookOpen} variant="emerald" index={1} />
          <StatCard label="Total Rooms" value={stats?.rooms ?? 0} icon={MapPin} variant="cyan" index={2} />
          <StatCard label="Schedules" value={stats?.schedules ?? 0} icon={CalendarDays} variant="teal" index={3} />
          <StatCard label="Notices" value={stats?.notices ?? 0} icon={Bell} variant="amber" index={4} />
          <StatCard label="Schedule Changes" value={stats?.changes ?? 0} icon={AlertCircle} variant="amber" index={5} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
        {/* Recent notices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 card-3d card-inner-glow p-4 sm:p-5"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-amber-glow">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Recent Notices</h3>
                  <p className="text-[10px] text-muted-foreground">Latest 5 announcements</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("notices")}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all →
              </button>
            </div>

            {noticesLoading ? (
              <LoadingState message="Loading notices…" className="py-8" />
            ) : !notices || notices.length === 0 ? (
              <EmptyState icon={Bell} title="No notices yet" message="Posted notices will appear here." />
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto scrollbar-premium pr-1">
                {notices.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative p-3 rounded-lg bg-card/60 border border-border/60 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {n.isPinned && (
                        <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5 fill-amber-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${CATEGORY_COLORS[n.category] ?? CATEGORY_COLORS.general}`}>
                            {n.category.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold line-clamp-1">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.content}</p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-3d card-inner-glow p-4 sm:p-5"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-teal-glow">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Quick Actions</h3>
                <p className="text-[10px] text-muted-foreground">Jump to a creation form</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a, i) => (
                <motion.button
                  key={a.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate(a.target)}
                  className="relative overflow-hidden p-3 rounded-xl border border-border bg-card/60 hover:border-primary/40 transition-colors text-left group"
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-white mb-2 shadow-sm`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-semibold">{a.label}</div>
                  <div className="text-[10px] text-muted-foreground">Click to open form</div>
                </motion.button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border border-teal-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Live today · {stats?.todayName ?? "—"}
                </span>
              </div>
              <p className="text-2xl font-bold text-gradient-primary">
                {stats?.todayClasses ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">classes scheduled today</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionShell>
  );
}
