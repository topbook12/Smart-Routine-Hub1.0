import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/session";

export async function GET() {
  const student = await getCurrentStudent();
  if (!student) return NextResponse.json({ student: null }, { status: 200 });
  return NextResponse.json({ student });
}
