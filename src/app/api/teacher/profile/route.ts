import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

// GET /api/teacher/profile — current teacher's full profile
export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const u = await db.user.findUnique({
    where: { id: user.id },
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
    },
  });
  return NextResponse.json(u);
}

// PUT /api/teacher/profile — update own profile (teacher/admin can update self)
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const allowed = ["fullName", "designation", "department", "phone", "officeRoom", "bio", "photoURL"];
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  // Password change (optional)
  if (body.password && typeof body.password === "string" && body.password.length >= 4) {
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const updated = await db.user.update({
    where: { id: user.id },
    data,
    select: { id: true, fullName: true, email: true, designation: true, phone: true, officeRoom: true, bio: true },
  });
  return NextResponse.json(updated);
}
