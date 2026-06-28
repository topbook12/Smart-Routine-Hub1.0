import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUser } from "@/lib/effective-user";
import { getSettings, invalidateSettingsCache } from "@/lib/settings";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/types";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const user = await getEffectiveUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<SiteSettings>;
  const merged: SiteSettings = { ...DEFAULT_SETTINGS, ...body };
  // upsert setting row
  const existing = await db.setting.findUnique({ where: { key: "site_settings" } });
  if (existing) {
    await db.setting.update({ where: { key: "site_settings" }, data: { value: JSON.stringify(merged) } });
  } else {
    await db.setting.create({ data: { key: "site_settings", value: JSON.stringify(merged) } });
  }
  invalidateSettingsCache();
  return NextResponse.json(merged);
}
