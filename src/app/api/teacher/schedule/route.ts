import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

// GET /api/teacher/schedule — current teacher's schedules (with optional day filter)
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const where: Prisma.ScheduleWhereInput = { isActive: true, teacherId: user.id };
  const day = searchParams.get("day");
  if (day) where.dayOfWeek = day;
  const schedules = await db.schedule.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(schedules);
}

// PUT /api/teacher/schedule — update one of the teacher's own schedule entries
// Body: { id, startTime?, endTime?, dayOfWeek?, roomId?, roomNumber? }
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, startTime, endTime, dayOfWeek, roomId, roomNumber } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify the schedule belongs to this teacher (admin can edit any via /api/schedules)
  const sched = await db.schedule.findUnique({ where: { id } });
  if (!sched) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  if (sched.teacherId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only edit your own classes" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (startTime) data.startTime = startTime;
  if (endTime) data.endTime = endTime;
  if (dayOfWeek) data.dayOfWeek = dayOfWeek;
  if (roomId) {
    data.roomId = roomId;
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (room) data.roomNumber = room.roomNumber;
  }
  if (roomNumber && !roomId) data.roomNumber = roomNumber;

  const updated = await db.schedule.update({ where: { id }, data });
  return NextResponse.json(updated);
}
