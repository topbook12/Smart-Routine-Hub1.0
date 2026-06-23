import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const slots = await db.timeSlot.findMany({
    where: { isActive: true },
    orderBy: { slotOrder: "asc" },
  });
  return NextResponse.json(slots);
}
