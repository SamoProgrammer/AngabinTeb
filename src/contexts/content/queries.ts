import "server-only";
import { sql, eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { contents, topics, translations } from "@/db/schema";
import { overlayTranslations } from "@/lib/translate";
import type { ContentCard, ContentDetail, ContentKind, TopicCard } from "./model";

export async function listContent(
  kind: ContentKind,
  locale: string,
  topicId?: string,
  page = 1,
): Promise<{ rows: ContentCard[]; total: number }> {
  const where = and(
    eq(contents.kind, kind),
    eq(contents.status, "published"),
    topicId
      ? sql`${contents.id} in (select content_id from content_topic where topic_id = ${topicId})`
      : undefined,
  );
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(contents)
    .where(where);
  const rows = await db
    .select({
      id: contents.id,
      slug: contents.slug,
      title: contents.title,
      videoUrl: contents.videoUrl,
      publishedAt: contents.publishedAt,
    })
    .from(contents)
    .where(where)
    .orderBy(desc(contents.publishedAt))
    .limit(20)
    .offset((page - 1) * 20);
  const overrides =
    rows.length === 0
      ? []
      : await db
          .select()
          .from(translations)
          .where(and(
            eq(translations.entityType, "content"),
            sql`${translations.entityId} = any(${rows.map((r) => r.id)}::text[])`,
          ));
  return {
    rows: overlayTranslations("content", rows, overrides, locale, ["title"]) as ContentCard[],
    total: count?.total ?? 0,
  };
}

export async function getContent(slug: string, locale: string): Promise<ContentDetail | null> {
  const [row] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.slug, slug), eq(contents.status, "published")));
  if (!row) return null;
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "content"), eq(translations.entityId, row.id)));
  return overlayTranslations("content", [row], overrides, locale, ["title", "body"])[0] as ContentDetail;
}

export async function listTopics(locale: string): Promise<TopicCard[]> {
  const rows = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      count: sql<number>`(select count(*)::int from content_topic ct join content c on c.id = ct.content_id
                            where ct.topic_id = topic.id and c.status = 'published')`,
    })
    .from(topics)
    .orderBy(topics.name);
  const overrides =
    rows.length === 0
      ? []
      : await db
          .select()
          .from(translations)
          .where(and(
            eq(translations.entityType, "topic"),
            sql`${translations.entityId} = any(${rows.map((r) => r.id)}::text[])`,
          ));
  return overlayTranslations("topic", rows, overrides, locale, ["name"]).map((r) => ({ ...r, count: r.count ?? 0 })) as TopicCard[];
}