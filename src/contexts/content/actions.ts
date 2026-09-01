"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { contents, topics, contentTopics, translations } from "@/db/schema";
import { requireAdmin } from "@/contexts/identity/actions";

function str(v: FormDataEntryValue | null): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

const contentSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["article", "pamphlet", "faq", "video"]),
  slug: z.string().min(1),
  titleFa: z.string().min(1),
  bodyFa: z.string().min(1),
  titleEn: z.string().optional(),
  titleAr: z.string().optional(),
  bodyEn: z.string().optional(),
  bodyAr: z.string().optional(),
  videoUrl: z.string().optional(),
  status: z.enum(["draft", "published"]),
  topicIds: z.array(z.string()),
});

export async function saveContent(input: FormData) {
  await requireAdmin();
  const parsed = contentSchema.safeParse({
    id: str(input.get("id")),
    kind: input.get("kind"),
    slug: str(input.get("slug")),
    titleFa: str(input.get("titleFa")),
    bodyFa: str(input.get("bodyFa")),
    titleEn: str(input.get("titleEn")),
    titleAr: str(input.get("titleAr")),
    bodyEn: str(input.get("bodyEn")),
    bodyAr: str(input.get("bodyAr")),
    videoUrl: str(input.get("videoUrl")),
    status: input.get("status"),
    topicIds: input.getAll("topicIds"),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const data = parsed.data;
  const id = data.id ?? randomUUID();
  await db.transaction(async (tx) => {
    if (data.id) {
      const [existing] = await tx.select().from(contents).where(eq(contents.id, data.id));
      await tx.update(contents).set({
        kind: data.kind,
        slug: data.slug,
        title: data.titleFa,
        body: data.bodyFa,
        videoUrl: data.videoUrl ?? null,
        status: data.status,
        publishedAt: data.status === "published" ? (existing?.publishedAt ?? new Date()) : null,
      }).where(eq(contents.id, data.id));
    } else {
      await tx.insert(contents).values({
        id,
        kind: data.kind,
        slug: data.slug,
        title: data.titleFa,
        body: data.bodyFa,
        videoUrl: data.videoUrl ?? null,
        status: data.status,
        publishedAt: data.status === "published" ? new Date() : null,
      });
    }
    await tx.delete(translations).where(and(eq(translations.entityType, "content"), eq(translations.entityId, id)));
    for (const [locale, field, value] of [
      ["en", "title", data.titleEn],
      ["ar", "title", data.titleAr],
      ["en", "body", data.bodyEn],
      ["ar", "body", data.bodyAr],
    ] as const) {
      if (value) await tx.insert(translations).values({ entityType: "content", entityId: id, locale, field, value });
    }
    await tx.delete(contentTopics).where(eq(contentTopics.contentId, id));
    if (data.topicIds.length > 0) {
      await tx.insert(contentTopics).values(data.topicIds.map((topicId) => ({ contentId: id, topicId })));
    }
  });
  return { ok: true as const, id };
}

const topicSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
});

export async function saveTopic(input: FormData) {
  await requireAdmin();
  const parsed = topicSchema.safeParse({
    id: str(input.get("id")),
    slug: str(input.get("slug")),
    name: str(input.get("name")),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const data = parsed.data;
  const id = data.id ?? randomUUID();
  await db.transaction(async (tx) => {
    if (data.id) {
      await tx.update(topics).set({ slug: data.slug, name: data.name }).where(eq(topics.id, data.id));
    } else {
      await tx.insert(topics).values({ id, slug: data.slug, name: data.name });
    }
  });
  return { ok: true as const, id };
}