import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUser } from "@/lib/effective-user";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

// GET /api/students?program=&semester=&isActive=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.StudentWhereInput = {};
  const program = searchParams.get("program");
  const semester = searchParams.get("semester");
  const isActive = searchParams.get("isActive");
  if (program) where.program = program;
  if (semester) where.semester = Number(semester);
  if (isActive !== null && isActive !== undefined) where.isActive = isActive === "true";

  const students = await db.student.findMany({
    where,
    orderBy: [{ program: "asc" }, { semester: "asc" }, { rollNumber: "asc" }],
    select: {
      id: true,
      fullName: true,
      rollNumber: true,
      program: true,
      semester: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json(students);
}

// POST — create a new student (admin only)
export async function POST(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
  }
  const body = await req.json();

  // Validate required fields
  if (!body.fullName || !body.rollNumber) {
    return NextResponse.json({ error: "Full name and roll number are required" }, { status: 400 });
  }

  // Check for duplicate roll number
  const existing = await db.student.findUnique({ where: { rollNumber: body.rollNumber } });
  if (existing) {
    return NextResponse.json({ error: "A student with this roll number already exists" }, { status: 409 });
  }

  const password = body.password || "student123"; // default password
  const passwordHash = await bcrypt.hash(password, 10);

  const created = await db.student.create({
    data: {
      fullName: body.fullName,
      rollNumber: body.rollNumber,
      program: body.program || "bsc",
      semester: body.semester ? Number(body.semester) : 1,
      passwordHash,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
    },
    select: {
      id: true,
      fullName: true,
      rollNumber: true,
      program: true,
      semester: true,
      isActive: true,
    },
  });
  return NextResponse.json({ ...created, password }, { status: 201 });
}

// PUT — update a student (admin only)
export async function PUT(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
  }
  const body = await req.json();
  const { id, password, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  // Check roll number uniqueness if changing
  if (rest.rollNumber) {
    const existing = await db.student.findUnique({ where: { rollNumber: rest.rollNumber } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Roll number already in use" }, { status: 409 });
    }
  }

  const updated = await db.student.update({
    where: { id },
    data,
    select: { id: true, fullName: true, rollNumber: true, program: true, semester: true, isActive: true },
  });
  return NextResponse.json(updated);
}

// DELETE — remove a student (admin only)
export async function DELETE(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
