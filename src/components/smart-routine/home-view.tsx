"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Clock,
  Download,
  FlaskConical,
  GraduationCap,
  Library,
  LogIn,
  MapPin,
  Sparkles,
  User2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  useRealtimeNotices,
  useRealtimeSchedules,
  useCurrentUser,
  useRealtimeStats,
} from "@/hooks/use-realtime-data";
import { usePWA } from "@/hooks/use-pwa";
import { NotificationList } from "@/components/shared/notification-list";
import { StatCard } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TODAY = (() => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
})();

export function HomeView() {
  const router = useRouter();
  const online = useUIStore((s) => s.online);
  const notificationsEnabled = useUIStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useUIStore((s) => s.setNotificationsEnabled);
  const settings = useSettingsStore((s) => s.settings);
  const { installPromptAvailable, promptInstall } = usePWA();
  const { data: userResp } = useCurrentUser();
  const user = userResp?.user;
  const { data: notices, isLoading: noticesLoading } = useRealtimeNotices({ limit: 6 });
  const { data: stats } = useRealtimeStats();

  const handleInstall = async () => {
    const ok = await promptInstall();
    if (!ok && !installPromptAvailable) {
      toast.info("Install not available", {
        description: "Use your browser menu → Add to Home Screen to install the app.",
      });
    } else if (ok) {
      toast.success("Installed!", { description: "Smart Routine Hub has been installed." });
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!("Notification" in window)) {
        toast.error("Notifications not supported in this browser");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotificationsEnabled(true);
        toast.success("Notifications enabled", {
          description: "You will receive real-time class change alerts.",
        });
        new Notification("Smart Routine Hub", {
          body: "Notifications are now enabled. You'll get class change alerts in real-time.",
        });
      } else {
        toast.error("Permission denied", { description: "Enable notifications in browser settings." });
      }
    } else {
      setNotificationsEnabled(false);
      toast.info("Notifications disabled");
    }
  };

  return (
    <div className="relative">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden hero-bg">
        {/* Floating blobs */}
        <div className="absolute top-10 left-[10%] h-40 w-40 rounded-full bg-teal-400/20 blur-3xl animate-blob" />
        <div className="absolute top-20 right-[15%] h-52 w-52 rounded-full bg-amber-400/15 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        <div className="absolute bottom-0 left-[40%] h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl animate-blob" style={{ animationDelay: "8s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-12 lg:pt-16 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Session badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-premium text-xs font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Academic Session {settings.academicSession}
              <span className="text-muted-foreground">·</span>
              <span className="text-primary">Live</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="text-gradient-hero">Smart Routine Hub</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {settings.siteTagline} — Real-time class schedules, instant notices &amp; resource library for{" "}
              <span className="text-foreground font-medium">{settings.departmentName}</span>.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
              {user ? (
                <Link href={user.role === "admin" ? "/admin" : "/teacher"}>
                  <Button className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white gap-1.5 h-11 px-5">
                    <Sparkles className="h-4 w-4" /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white gap-1.5 h-11 px-5">
                    <LogIn className="h-4 w-4" /> Teacher / Admin Login
                  </Button>
                </Link>
              )}

              {installPromptAvailable && (
                <Button
                  onClick={handleInstall}
                  variant="outline"
                  className="btn-3d gap-1.5 h-11 px-5 border-primary/40"
                >
                  <Download className="h-4 w-4 text-primary" /> Install App
                </Button>
              )}

              <Button
                onClick={toggleNotifications}
                variant="outline"
                className={cn(
                  "btn-3d gap-1.5 h-11 px-4",
                  notificationsEnabled && "border-primary/40 text-primary"
                )}
              >
                {notificationsEnabled ? (
                  <>
                    <BellRing className="h-4 w-4 text-primary" /> Alerts On
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" /> Enable Alerts
                  </>
                )}
              </Button>
            </div>

            {/* Status indicators */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium",
                  online
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {online ? "Online" : "Offline"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                <Zap className="h-3.5 w-3.5" /> Real-time sync
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                <CalendarDays className="h-3.5 w-3.5" /> Today: {TODAY}
              </span>
            </div>
          </motion.div>

          {/* Quick stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-12 max-w-5xl mx-auto"
            >
              <StatCard label="Total Classes" value={stats.schedules} icon={CalendarRange} variant="teal" index={0} />
              <StatCard label="Today's Classes" value={stats.todayClasses} icon={Clock} variant="amber" index={1} />
              <StatCard label="Teachers" value={stats.teachers} icon={User2} variant="emerald" index={2} />
              <StatCard label="Rooms" value={stats.rooms} icon={MapPin} variant="cyan" index={3} />
            </motion.div>
          )}
        </div>
      </section>

      {/* ===== NOTIFICATIONS ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BellRing className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold">Latest Notices</h2>
            </div>
            <p className="text-sm text-muted-foreground">Real-time announcements &amp; class changes</p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {notices?.length ?? 0} notices
          </Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <NotificationList notices={notices ?? []} loading={noticesLoading} />
        </div>
      </section>

      {/* ===== PROGRAMS ===== */}
      <ProgramsSection />

      {/* ===== FEATURES ===== */}
      <FeaturesSection />
    </div>
  );
}

function ProgramsSection() {
  const router = useRouter();
  const { data: schedules } = useRealtimeSchedules();

  const bscSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const mscSemesters = [1, 2, 3];

  const countFor = (program: string, semester: number) =>
    schedules?.filter((s) => s.program === program && s.semester === semester).length ?? 0;

  const SemesterCard = ({
    semester,
    program,
    variant,
  }: {
    semester: number;
    program: "bsc" | "msc";
    variant: "teal" | "amber";
  }) => {
    const count = countFor(program, semester);
    const gradient =
      variant === "teal"
        ? "from-teal-500 via-emerald-500 to-cyan-500"
        : "from-amber-500 via-orange-500 to-yellow-500";
    const glow = variant === "teal" ? "shadow-teal-glow" : "shadow-amber-glow";
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push(`/?view=master-calendar&program=${program}&semester=${semester}`)}
        className={cn(
          "group relative card-3d card-inner-glow p-4 text-left overflow-hidden",
        )}
      >
        <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", gradient)} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span
              className={cn(
                "inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br text-white text-xs font-bold",
                gradient,
                glow
              )}
            >
              {semester}
            </span>
            <Badge variant="outline" className="text-[10px] h-5">
              {count} {count === 1 ? "class" : "classes"}
            </Badge>
          </div>
          <p className="font-semibold text-sm">
            {program === "bsc" ? "BSc" : "MSc"} · Sem {semester}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            View routine →
          </p>
        </div>
      </motion.button>
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Choose Your <span className="text-gradient-primary">Program</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Pick a program and semester to view the detailed class routine with real-time updates.
        </p>
      </div>

      {/* BSc */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-teal-glow">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">B.Sc. Engineering</h3>
            <p className="text-xs text-muted-foreground">8 semesters · Bachelor's programme</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {bscSemesters.map((s) => (
            <SemesterCard key={s} semester={s} program="bsc" variant="teal" />
          ))}
        </div>
      </div>

      {/* MSc */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-amber-glow">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">M.Sc. Engineering</h3>
            <p className="text-xs text-muted-foreground">3 semesters · Master's programme</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {mscSemesters.map((s) => (
            <SemesterCard key={s} semester={s} program="msc" variant="amber" />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Smart Scheduling",
      desc: "Dynamic class routines with real-time updates. Instantly see cancellations, room changes and reschedules as they happen.",
      Icon: CalendarRange,
      gradient: "from-teal-500 to-emerald-500",
      glow: "shadow-teal-glow",
    },
    {
      title: "Teacher Directory",
      desc: "Browse faculty members, their designations and contact info. Teachers can manage their own classes from a dedicated dashboard.",
      Icon: User2,
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-glow",
    },
    {
      title: "Resource Library",
      desc: "One-click access to course materials, lecture notes and reference books organised by degree and semester via Google Drive.",
      Icon: Library,
      gradient: "from-cyan-500 to-teal-500",
      glow: "shadow-cyan-glow",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Why Smart Routine Hub?</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Built for <span className="text-gradient-amber">modern campuses</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Everything students, teachers and administrators need — in one beautifully crafted portal.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="card-3d card-inner-glow p-6"
          >
            <div
              className={cn(
                "inline-flex h-12 w-12 rounded-xl bg-gradient-to-br items-center justify-center text-white mb-4",
                f.gradient,
                f.glow
              )}
            >
              <f.Icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
