import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.CourseWhereInput = { isActive: true };
  const program = searchParams.get("program");
  const semester = searchParams.get("semester");
  if (program) where.program = program;
  if (semester) where.semester = Number(semester);
  const courses = await db.course.findMany({
    where,
    orderBy: [{ semester: "asc" }, { code: "asc" }],
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const created = await db.course.create({ data: { ...body, isActive: true } });
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
  const updated = await db.course.update({ where: { id }, data: rest });
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
  await db.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
