"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  MapPin,
  Plus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRealtimeStats, useRealtimeNotices } from "@/hooks/use-realtime-data";
import { StatCard, LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Section = "dashboard" | "teachers" | "courses" | "rooms" | "schedules" | "notices" | "library" | "settings";

export function AdminDashboardSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { data: stats, isLoading } = useRealtimeStats();
  const { data: notices } = useRealtimeNotices({ limit: 5 });

  if (isLoading || !stats) {
    return <LoadingState message="Loading dashboard…" />;
  }

  const quickActions: { label: string; icon: typeof Plus; section: Section; gradient: string }[] = [
    { label: "Add Teacher", icon: Users, section: "teachers", gradient: "from-teal-500 to-emerald-500" },
    { label: "Add Course", icon: BookOpen, section: "courses", gradient: "from-amber-500 to-orange-500" },
    { label: "Add Schedule", icon: CalendarDays, section: "schedules", gradient: "from-cyan-500 to-teal-500" },
    { label: "Post Notice", icon: Bell, section: "notices", gradient: "from-emerald-500 to-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-3d card-inner-glow p-5 sm:p-6 hero-bg"
      >
        <div className="relative z-10">
          <Badge variant="outline" className="mb-2">
            <Zap className="h-3 w-3 mr-1 text-primary" /> Live Overview
          </Badge>
          <h2 className="text-2xl font-bold mb-1">Welcome back, Admin 👋</h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a real-time snapshot of your departmental schedule system.
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Teachers" value={stats.teachers} icon={Users} variant="teal" index={0} />
        <StatCard label="Active Courses" value={stats.courses} icon={BookOpen} variant="amber" index={1} />
        <StatCard label="Total Rooms" value={stats.rooms} icon={MapPin} variant="cyan" index={2} />
        <StatCard label="Total Schedules" value={stats.schedules} icon={CalendarDays} variant="emerald" index={3} />
        <StatCard label="Active Notices" value={stats.notices} icon={Bell} variant="teal" index={4} />
        <StatCard label="Schedule Changes" value={stats.changes} icon={Zap} variant="amber" index={5} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent notices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-3d p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Recent Notices</h3>
            </div>
            <button
              onClick={() => onNavigate("notices")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {notices && notices.length > 0 ? (
              notices.slice(0, 4).map((n) => (
                <div key={n.id} className="flex items-start gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No notices yet</p>
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-3d p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(a.section)}
                className="relative card-3d card-inner-glow p-3.5 text-left overflow-hidden"
              >
                <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", a.gradient)} />
                <div className={cn("inline-flex h-9 w-9 rounded-lg bg-gradient-to-br items-center justify-center text-white mb-2", a.gradient)}>
                  <a.icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold">{a.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
