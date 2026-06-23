import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST(req: Request) {
  try {
    let force = false;
    try {
      const body = await req.json();
      force = !!body?.force;
    } catch {
      /* no body */
    }
    const result = await seedDatabase(force);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seed failed";
    console.error("[seed] error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
