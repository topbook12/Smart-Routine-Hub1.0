import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  const teachers = await db.user.findMany({
    where: { role: "teacher", isActive: true },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      designation: true,
      department: true,
      phone: true,
      officeRoom: true,
      bio: true,
      photoURL: true,
      role: true,
      isActive: true,
    },
  });
  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const passwordHash = await bcrypt.hash(body.password || "teacher123", 10);
  const pinHash = body.pin ? await bcrypt.hash(body.pin, 10) : null;
  const created = await db.user.create({
    data: {
      email: body.email.toLowerCase(),
      fullName: body.fullName,
      passwordHash,
      pinHash,
      designation: body.designation,
      department: body.department || "ICE, RU",
      phone: body.phone,
      officeRoom: body.officeRoom,
      bio: body.bio,
      role: "teacher",
      isActive: true,
    },
  });
  return NextResponse.json({ id: created.id, email: created.email, fullName: created.fullName }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, password, pin, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (pin) data.pinHash = await bcrypt.hash(pin, 10);
  const updated = await db.user.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, email: updated.email, fullName: updated.fullName });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
