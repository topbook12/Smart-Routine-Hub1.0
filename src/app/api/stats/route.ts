import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [teachers, courses, rooms, schedules, notices, changes] = await Promise.all([
    db.user.count({ where: { role: "teacher", isActive: true } }),
    db.course.count({ where: { isActive: true } }),
    db.room.count({ where: { isActive: true } }),
    db.schedule.count({ where: { isActive: true } }),
    db.notice.count({ where: { isApproved: true } }),
    db.scheduleChange.count({ where: { isActive: true } }),
  ]);

  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[today.getDay()];
  const todayClasses = await db.schedule.count({
    where: { isActive: true, dayOfWeek: todayName },
  });

  return NextResponse.json({
    teachers,
    courses,
    rooms,
    schedules,
    notices,
    changes,
    todayClasses,
    todayName,
  });
}
