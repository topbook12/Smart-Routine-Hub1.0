import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUser } from "@/lib/effective-user";

export async function GET() {
  const links = await db.libraryLink.findMany({
    where: { isActive: true },
    orderBy: [{ degree: "asc" }, { semester: "asc" }],
  });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const created = await db.libraryLink.create({ data: { ...body, isActive: true } });
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
  const updated = await db.libraryLink.update({ where: { id }, data: rest });
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
  await db.libraryLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
