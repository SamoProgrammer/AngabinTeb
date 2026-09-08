import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type SettingsValue = { url: string };

export const getSettings = cache(async (): Promise<Record<string, SettingsValue>> => {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, (r.valueJson ?? { url: "" }) as SettingsValue]));
});