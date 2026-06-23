"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, User, FlaskConical, BookOpen } from "lucide-react";
import type { Schedule, ScheduleChange } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  schedule: Schedule;
  change?: ScheduleChange;
  index?: number;
  compact?: boolean;
}

export function ScheduleCard({ schedule, change, index = 0, compact = false }: Props) {
  const isLab = schedule.classType === "lab";
  const isCancelled = change?.changeType === "cancelled";
  const isRescheduled = change?.changeType === "rescheduled";
  const isRoomChanged = change?.changeType === "room_changed";

  const gradient = isLab
    ? "from-amber-500 via-orange-500 to-yellow-500"
    : "from-teal-500 via-emerald-500 to-cyan-500";
  const glow = isLab ? "shadow-amber-glow" : "shadow-teal-glow";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "relative card-3d card-inner-glow overflow-hidden",
        isCancelled && "opacity-60"
      )}
    >
      {/* Top gradient bar */}
      <div className={cn("h-1.5 bg-gradient-to-r", gradient)} />

      <div className={cn("p-3.5", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r",
                  gradient,
                  glow
                )}
              >
                {isLab ? <FlaskConical className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                {schedule.courseCode}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {schedule.program} &middot; Sem {schedule.semester}
              </span>
            </div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{schedule.courseName}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground">
              {schedule.startTime} – {schedule.endTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">
              {schedule.teacherInitials ? `${schedule.teacherInitials} · ` : ""}
              {schedule.teacherName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Room {schedule.roomNumber}</span>
          </div>
        </div>

        {/* Change badges */}
        {isCancelled && (
          <div className="mt-2.5">
            <Badge variant="destructive" className="text-[10px] h-5">Cancelled</Badge>
            {change?.reason && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{change.reason}</p>}
          </div>
        )}
        {isRescheduled && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Badge className="text-[10px] h-5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
              Moved → {change?.newDay?.slice(0, 3)} {change?.newStartTime}
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5">Room {change?.newRoomNumber}</Badge>
          </div>
        )}
        {isRoomChanged && (
          <div className="mt-2.5">
            <Badge className="text-[10px] h-5 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">
              Room → {change?.newRoomNumber}
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
}
