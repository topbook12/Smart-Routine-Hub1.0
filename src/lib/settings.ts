import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/types";

let cache: { value: SiteSettings; ts: number } | null = null;
const TTL = 60_000;

export async function getSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return cache.value;
  const row = await db.setting.findUnique({ where: { key: "site_settings" } });
  let settings: SiteSettings = DEFAULT_SETTINGS;
  if (row?.value) {
    try {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
    } catch {
      settings = DEFAULT_SETTINGS;
    }
  } else {
    await db.setting.create({ data: { key: "site_settings", value: JSON.stringify(DEFAULT_SETTINGS) } });
  }
  cache = { value: settings, ts: now };
  return settings;
}

export function invalidateSettingsCache() {
  cache = null;
}
