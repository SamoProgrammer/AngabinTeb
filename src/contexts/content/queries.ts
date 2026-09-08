import "server-only";
import { cache } from "react";
import { sql, eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { contents, topics, conditions } from "@/db/schema";
import { localizedRows } from "@/lib/translate";
import { searchAll } from "@/contexts/catalog/queries";
import type { ConditionCard, ContentCard, ContentDetail, ContentKind, TopicCard, TopicHub } from "./model";

export const listContent = cache(async (
  kind: ContentKind,
  locale: string,
  topicId?: string,
  conditionId?: string,
  page = 1,
  pageSize = 20,
): Promise<{ rows: ContentCard[]; total: number }> => {
  const where = and(
    eq(contents.kind, kind),
    eq(contents.status, "published"),
    topicId
      ? sql`${contents.id} in (select content_id from content_topic where topic_id = ${topicId})`
      : undefined,
    conditionId
      ? eq(contents.id, conditionId)
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
      body: contents.body,
      videoUrl: contents.videoUrl,
      publishedAt: contents.publishedAt,
    })
    .from(contents)
    .where(where)
    .orderBy(desc(contents.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    rows: (await localizedRows("content", rows, locale, ["title", "body"])) as ContentCard[],
    total: count?.total ?? 0,
  };
});

export const getContent = cache(async (slug: string, locale: string): Promise<ContentDetail | null> => {
  const [row] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.slug, slug), eq(contents.status, "published")));
  if (!row) return null;
  return (await localizedRows("content", [row], locale, ["title", "body"]))[0] as ContentDetail;
});

export const listContentAdmin = cache(async () => {
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
});

export const listTopics = cache(async (locale: string): Promise<TopicCard[]> => {
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
  return (await localizedRows("topic", rows, locale, ["name"])).map((r) => ({ ...r, count: r.count ?? 0 })) as TopicCard[];
});

export const getCondition = cache(async (slug: string, locale: string): Promise<ConditionCard | null> => {
  const [row] = await db.select().from(conditions).where(eq(conditions.slug, slug));
  if (!row) return null;
  return (await localizedRows("condition", [row], locale, ["name"]))[0];
});

export const getTopicHub = cache(async (topicSlug: string, locale: string): Promise<TopicHub | null> => {
  const [topic] = await db.select().from(topics).where(eq(topics.slug, topicSlug));
  if (!topic) return null;
  const content = await listContent("article", locale, topic.id);
  const conditionRows = await db.select().from(conditions).where(
    sql`exists (select 1 from content_topic ct join content c on c.id = ct.content_id
                where ct.topic_id = ${topic.id} and c.id = ${conditions.id} and c.status = 'published')`,
  );
  const related = await searchAll(topic.name, locale);

  return {
    topic: (await localizedRows("topic", [topic], locale, ["name"]))[0],
    content: content.rows,
    conditions: await localizedRows("condition", conditionRows, locale, ["name"]),
    relatedServices: related.filter((r) => r.type === "service").slice(0, 4),
    relatedDoctors: related.filter((r) => r.type === "doctor" || r.type === "clinic").slice(0, 4),
  };
});