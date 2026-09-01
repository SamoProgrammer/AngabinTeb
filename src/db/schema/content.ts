import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const contents = pgTable("content", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // article | pamphlet | faq | video
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(), // Persian base
  body: text("body").notNull(),   // Persian base; FAQ answers and video descriptions live here too
  videoUrl: text("video_url"),    // non-null only when kind = 'video' (spec §5.5)
  status: text("status").notNull().default("draft"), // draft | published
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const topics = pgTable("topic", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(), // Persian base
});

export const conditions = pgTable("condition", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(), // Persian base
});

export const contentTopics = pgTable(
  "content_topic",
  {
    contentId: text("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.topicId] })],
);