import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

// GET /api/schedules?program=&semester=&teacherId=&roomId=&day=&classType=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.ScheduleWhereInput = { isActive: true };
  const program = searchParams.get("program");
  const semester = searchParams.get("semester");
  const teacherId = searchParams.get("teacherId");
  const roomId = searchParams.get("roomId");
  const day = searchParams.get("day");
  const classType = searchParams.get("classType");

  if (program) where.program = program;
  if (semester) where.semester = Number(semester);
  if (teacherId) where.teacherId = teacherId;
  if (roomId) where.roomId = roomId;
  if (day) where.dayOfWeek = day;
  if (classType) where.classType = classType;

  const schedules = await db.schedule.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const created = await db.schedule.create({ data: { ...body, isActive: true } });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = await db.schedule.update({ where: { id }, data: rest });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.schedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
