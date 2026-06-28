import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUser } from "@/lib/effective-user";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const where: { isActive: boolean; type?: string } = { isActive: true };
  if (type) where.type = type;
  const rooms = await db.room.findMany({ where, orderBy: { roomNumber: "asc" } });

  // Optional availability check
  const day = searchParams.get("day");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  if (day && startTime && endTime) {
    const conflicts = await db.schedule.findMany({
      where: { dayOfWeek: day, startTime, endTime, isActive: true },
      select: { roomId: true },
    });
    const conflictSet = new Set(conflicts.map((c) => c.roomId));
    return NextResponse.json(
      rooms.map((r) => ({ ...r, available: !conflictSet.has(r.id) }))
    );
  }
  return NextResponse.json(rooms);
}

export async function POST(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const created = await db.room.create({ data: { ...body, isActive: true } });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = await db.room.update({ where: { id }, data: rest });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.room.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
