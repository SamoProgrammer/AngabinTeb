"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/contexts/identity/actions";

function parseOrError<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => i.message).join("; ") };
  return { ok: true, data: r.data };
}

const SETTING_KEYS = ["regim24", "nobat24", "aparat", "leaflet", "enamad", "social"] as const;

const settingsSchema = z.object({
  key: z.enum(SETTING_KEYS),
  url: z.string().url().optional().or(z.literal("").transform(() => undefined)),
});

export async function saveSettings(input: FormData) {
  await requireAdmin();
  const parsed = parseOrError(settingsSchema, {
    key: input.get("key"),
    url: input.get("url"),
  });
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db
    .update(settings)
    .set({ valueJson: { url: data.url ?? "" }, updatedAt: new Date() })
    .where(eq(settings.key, data.key));
  return { ok: true as const };
}