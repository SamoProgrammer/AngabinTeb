import "server-only";
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { contents, topics, conditions, translations } from "@/db/schema";
import { overlayTranslations } from "@/lib/translate";
import { searchAll } from "@/contexts/catalog/queries";
import type { ConditionCard, ContentCard, ContentDetail, ContentKind, TopicCard, TopicHub } from "./model";

export async function listContent(
  kind: ContentKind,
  locale: string,
  topicId?: string,
  conditionId?: string,
  page = 1,
): Promise<{ rows: ContentCard[]; total: number }> {
  const where = and(
    eq(contents.kind, kind),
    eq(contents.status, "published"),
    topicId
      ? sql`${contents.id} in (select content_id from content_topic where topic_id = ${topicId})`
      : undefined,
    conditionId
      ? sql`${contents.id} in (select id from content where id = ${conditionId})`
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
            inArray(translations.entityId, rows.map((r) => r.id)),
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

export async function listContentAdmin() {
  return db
    .select({
      id: contents.id,
      kind: contents.kind,
      slug: contents.slug,
      title: contents.title,
      status: contents.status,
      createdAt: contents.createdAt,
    })
    .from(contents)
    .orderBy(desc(contents.createdAt))
    .limit(100);
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
            inArray(translations.entityId, rows.map((r) => r.id)),
          ));
  return overlayTranslations("topic", rows, overrides, locale, ["name"]).map((r) => ({ ...r, count: r.count ?? 0 })) as TopicCard[];
}

export async function getCondition(slug: string, locale: string): Promise<ConditionCard | null> {
  const [row] = await db.select().from(conditions).where(eq(conditions.slug, slug));
  if (!row) return null;
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "condition"), eq(translations.entityId, row.id)));
  return overlayTranslations("condition", [row], overrides, locale, ["name"])[0];
}

export async function getTopicHub(topicSlug: string, locale: string): Promise<TopicHub | null> {
  const [topic] = await db.select().from(topics).where(eq(topics.slug, topicSlug));
  if (!topic) return null;
  const content = await listContent("article", locale, topic.id);
  const conditionRows = await db.select().from(conditions).where(
    sql`exists (select 1 from content_topic ct join content c on c.id = ct.content_id
                where ct.topic_id = ${topic.id} and c.id = ${conditions.id} and c.status = 'published')`,
  );
  const conditionOverrides =
    conditionRows.length === 0
      ? []
      : await db
          .select()
          .from(translations)
          .where(and(
            eq(translations.entityType, "condition"),
            inArray(translations.entityId, conditionRows.map((r) => r.id)),
          ));
  const related = await searchAll(topic.name, locale);

  return {
    topic: overlayTranslations("topic", [topic], await db.select().from(translations)
      .where(and(eq(translations.entityType, "topic"), eq(translations.entityId, topic.id))), locale, ["name"])[0],
    content: content.rows,
    conditions: overlayTranslations("condition", conditionRows, conditionOverrides, locale, ["name"]),
    relatedServices: related.filter((r) => r.type === "service").slice(0, 4),
    relatedDoctors: related.filter((r) => r.type === "doctor" || r.type === "clinic").slice(0, 4),
  };
}