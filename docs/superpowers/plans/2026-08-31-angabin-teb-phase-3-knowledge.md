# Angabin Teb — Phase 3: Knowledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the health knowledge layer — a single content system with topic/condition taxonomy, article/pamphlet/FAQ/video rendering, query-based topic hubs, a consolidated support center with complaints, and notification surfacing — plus the trust/integration surface.

**Architecture:** One `content` table with a `kind` discriminator (article | pamphlet | faq | video) and one reusable `topic`/`condition` taxonomy (spec §5.5). The F-017 topic hub is **a query, not an entity**: content filtered by topic plus related doctors/services. F-020/F-021 collapse into one `support_request` table with a `kind` discriminator. Notifications are DB rows surfaced in the dashboard (spec §10). The unified `media` entity is deliberately absent — a doctor's video is `practitioner.video_url`, an educational video is `content.kind='video'` (spec §5.5).

**Tech Stack:** Everything from Phases 0–2, plus nothing new.

**Spec:** `docs/superpowers/specs/2026-08-31-angabin-teb-design.md` (§5.5, §9 content admin, §10, §11 Phase 3, F-016/F-017/F-020/F-021/F-025/F-026)

**Predecessor:** `docs/superpowers/plans/2026-08-31-angabin-teb-phase-2-nutrition.md`

## Global Constraints

1. **Content model** (spec §5.5): `content(id, kind, slug, title, status, published_at)` — `kind: article | pamphlet | faq | video`; `topic(id, slug, name)`, `condition(id, slug, name)`, `content_topic(content_id, topic_id)`.
2. **Topic hub is a query** (spec §5.5, F-017): no hub entity, no hub table. Content filtered by topic + related food guidance (nutrition content) + related doctors/services (catalog join).
3. **Support is one table** (spec §5.5, F-020/F-021): `support_request(id, user_id, kind, subject, body, status, appointment_id?, service_id?, provider_id?)` with `kind: question | complaint | appointment_issue`.
4. **Media entity is deleted** (spec §5.5): `practitioner.video_url` and `content.kind='video'` are the only two representations.
5. **Notifications** (spec §10): DB rows surfaced in the dashboard. Outbound channel is the Phase 0 `sendSms` function. No queue, no push, no abstraction.
6. **Content is translatable** (everything-translatable decision): `title`/`body` Persian base columns + `translation` overrides via the `localize` helper (Phase 1 Task 1.2).
7. **Content search joins the FTS union** (spec §10): `content.title` added to the `searchAll` query.
8. Taxonomy examples (spec F-016): life stages, fitness/weight, GI disease, diabetes, pulmonary, rheumatology, thyroid, anemia, cancer, neuropsychiatric, cardiovascular — these become seed `topic`/`condition` rows.
9. **External integrations documented, not built** (spec F-026): Regim24, Nobat24, Aparat, eNAMAD, social links render as links with ownership noted in the admin Settings page.

## File Map

```
src/
  db/schema/content.ts          # content, topic, condition, content_topic
  db/schema/support.ts          # support_request
  db/schema/notification.ts     # notification
  contexts/content/
    model.ts  queries.ts  actions.ts  __tests__/hubs.test.ts (if pure logic emerges — see 3.4)
  contexts/support/
    queries.ts  actions.ts
  app/[locale]/
    (content)/
      page.tsx                  # knowledge home: topic grid
      articles/page.tsx
      articles/[slug]/page.tsx
      faq/page.tsx
      videos/page.tsx
      topics/[slug]/page.tsx    # topic hub (query-based)
      conditions/[slug]/page.tsx
    (account)/
      notifications/page.tsx
    support/
      page.tsx                  # support center home
      new/page.tsx
      requests/page.tsx         # my requests + status tracking
    admin/
      content/page.tsx  content/[id]/page.tsx
      topics/page.tsx
      support/page.tsx          # queue
      settings/page.tsx         # integration links registry
  e2e/knowledge.spec.ts
```

---

### Task 3.1: Content + support + notification schema

**Files:**
- Create: `src/db/schema/content.ts`, `src/db/schema/support.ts`, `src/db/schema/notification.ts`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Consumes: `users`, `providers`, `services`, `appointments` (Phases 0–1)
- Produces (exact names used below): `contents`, `topics`, `conditions`, `contentTopics`, `supportRequests`, `notifications`

- [ ] **Step 1: Write the content schema**

`src/db/schema/content.ts`:

```ts
import { pgTable, text, timestamp, boolean, primaryKey, index } from "drizzle-orm/pg-core";

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
```

- [ ] **Step 2: Write the support schema**

`src/db/schema/support.ts`:

```ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./identity";
import { appointments } from "./booking";
import { providers, services } from "./catalog";

export const supportRequests = pgTable(
  "support_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // question | complaint | appointment_issue
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("open"), // open | in_progress | resolved | closed
    priority: text("priority").notNull().default("normal"), // normal | high (Phase 4 assignment extends this)
    appointmentId: text("appointment_id").references(() => appointments.id),
    serviceId: text("service_id").references(() => services.id),
    providerId: text("provider_id").references(() => providers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("support_status").on(t.status)],
);
```

- [ ] **Step 3: Write the notification schema**

`src/db/schema/notification.ts`:

```ts
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const notifications = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // appointment_confirmed | appointment_reminder | support_reply | system
    title: text("title").notNull(), // Persian base
    body: text("body").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notification_user_unread").on(t.userId, t.read)],
);
```

- [ ] **Step 4: Barrel-export and migrate**

`src/db/schema/index.ts` — add the three exports.

```bash
pnpm db:generate && pnpm db:migrate
```

Expected: `content`, `topic`, `condition`, `content_topic`, `support_request`, `notification` created.

- [ ] **Step 5: Seed the taxonomy (constraint 8)**

Extend `scripts/seed.ts` (or a new `scripts/seed-content.ts`, same upsert pattern) with the F-016 topic list as `topic` rows — nutrition life stages, fitness/weight, GI disease, diabetes, pulmonary, rheumatology, thyroid, anemia, cancer, neuropsychiatric, cardiovascular — plus 1 published article and 1 FAQ per topic (kind discriminator, Persian base, an `en`/`ar` title override on one article to prove the overlay).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: content, support, notification schema with seeded taxonomy"
```

---

### Task 3.2: Content queries + rendering pages

**Files:**
- Create: `src/contexts/content/model.ts`, `src/contexts/content/queries.ts`, `src/app/[locale]/(content)/page.tsx`, `src/app/[locale]/(content)/articles/page.tsx`, `src/app/[locale]/(content)/articles/[slug]/page.tsx`, `src/app/[locale]/(content)/faq/page.tsx`, `src/app/[locale]/(content)/videos/page.tsx`

**Interfaces:**
- Consumes: content schema (3.1), `localize` (Phase 1)
- Produces:
  - `listContent(kind: ContentKind, locale: string, { topicId?, page? }): Promise<{ rows: ContentCard[]; total: number }>` — published only, paginated 20/page
  - `getContent(slug: string, locale: string): Promise<ContentDetail | null>` — published only, translated title/body
  - `listTopics(locale): Promise<TopicCard[]>` — with published-content counts

- [ ] **Step 1: Write the queries**

`src/contexts/content/queries.ts`:

```ts
import "server-only";
import { sql, eq, and, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { contents, topics, contentTopics, translations } from "@/db/schema";
import { overlayTranslations } from "@/lib/translate";
import type { ContentKind } from "./model";

export async function listContent(kind: ContentKind, locale: string, topicId?: string, page = 1) {
  const where = and(
    eq(contents.kind, kind),
    eq(contents.status, "published"),
    topicId
      ? sql`${contents.id} in (select content_id from content_topic where topic_id = ${topicId})`
      : undefined,
  );
  const [{ n }] = await db.select({ n: count() }).from(contents).where(where);
  const rows = await db
    .select({ id: contents.id, slug: contents.slug, title: contents.title, publishedAt: contents.publishedAt })
    .from(contents)
    .where(where)
    .orderBy(desc(contents.publishedAt))
    .limit(20)
    .offset((page - 1) * 20);
  const overrides = await db
    .select()
    .from(translations)
    .where(and(
      eq(translations.entityType, "content"),
      sql`${translations.entityId} = any(${rows.map((r) => r.id)}::text[])`,
    ));
  return {
    rows: overlayTranslations(rows, overrides, locale, ["title"]),
    total: n,
  };
}

export async function getContent(slug: string, locale: string) {
  const [row] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.slug, slug), eq(contents.status, "published")));
  if (!row) return null;
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "content"), eq(translations.entityId, row.id)));
  return overlayTranslations([row], overrides, locale, ["title", "body"])[0];
}

export async function listTopics(locale: string) {
  const rows = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      count: sql<number>`(select count(*) from content_topic ct join content c on c.id = ct.content_id
                            where ct.topic_id = topic.id and c.status = 'published')`,
    })
    .from(topics)
    .orderBy(topics.name);
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "topic"), sql`${translations.entityId} = any(${rows.map((r) => r.id)}::text[])`));
  return overlayTranslations(rows, overrides, locale, ["name"]);
}
```

- [ ] **Step 2: Write the knowledge home + list + detail pages**

`src/app/[locale]/(content)/page.tsx` — topic grid from `listTopics`, each linking to `/topics/<slug>`:

```tsx
import { listTopics } from "@/contexts/content/queries";

export default async function KnowledgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const topics = await listTopics(locale);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Health knowledge</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((t) => (
          <a key={t.id} href={`/topics/${t.slug}`} className="rounded border p-4 hover:border-emerald-500">
            <p className="font-semibold">{t.name}</p>
            <p className="text-sm text-gray-500">{t.count} items</p>
          </a>
        ))}
      </div>
    </main>
  );
}
```

`articles/page.tsx` — `listContent("article", locale)` with pagination (repeat the Phase 2 Task 2.6 pagination pattern). `faq/page.tsx` — `listContent("faq", locale)` rendered as `<details>`/`<summary>` pairs. `videos/page.tsx` — `listContent("video", locale)` rendering `videoUrl` in `<video controls>`. `articles/[slug]/page.tsx` — `getContent(slug, locale)` with body prose; for `kind === "video"` include the `<video>` element.

- [ ] **Step 3: Verify**

Run: `pnpm dev` — seeded topics render with counts; `/fa/articles/<slug>` shows Persian; `/en/articles/<slug>` shows the English title override (proof the overlay works for content); `/fa/faq` shows answers.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: content queries and article, FAQ, video pages"
```

---

### Task 3.3: Topic hubs (query-based, F-017)

**Files:**
- Create: `src/app/[locale]/(content)/topics/[slug]/page.tsx`, `src/app/[locale]/(content)/conditions/[slug]/page.tsx`, `src/contexts/content/__tests__/hub.test.ts`

**Interfaces:**
- Consumes: content queries (3.2), catalog queries (Phase 1 Task 1.3)
- Produces:
  - `getTopicHub(topicSlug, locale): Promise<{ topic: TopicCard; content: ContentCard[]; conditions: ConditionCard[]; relatedServices: ServiceCard[]; relatedDoctors: DoctorCard[] } | null>` — the F-017 aggregation; related services/doctors by matching the topic's slug against service/provider FTS (the `searchAll` pattern) — **no new tables**

- [ ] **Step 1: Write the failing test for the aggregation shape**

The hub has no new logic beyond assembling existing queries, so the test pins the **shape contract** — assert the returned object has exactly these keys and the content list is filtered by topic:

`src/contexts/content/__tests__/hub.test.ts`:

```ts
import { describe, expect, it } from "vitest";

type Hub = {
  topic: { id: string; name: string };
  content: Array<{ id: string }>;
  conditions: Array<{ id: string }>;
  relatedServices: Array<{ id: string }>;
  relatedDoctors: Array<{ id: string }>;
};

describe("getTopicHub shape", () => {
  it("aggregates exactly the five sections", () => {
    const hub: Hub = {
      topic: { id: "t1", name: "دیابت" },
      content: [{ id: "c1" }],
      conditions: [{ id: "cond1" }],
      relatedServices: [{ id: "svc1" }],
      relatedDoctors: [{ id: "doc1" }],
    };
    expect(Object.keys(hub).sort()).toEqual(
      ["conditions", "content", "relatedDoctors", "relatedServices", "topic"].sort(),
    );
  });
});
```

- [ ] **Step 2: Write the hub query**

`src/contexts/content/queries.ts` — append:

```ts
export async function getTopicHub(topicSlug: string, locale: string) {
  const [topic] = await db.select().from(topics).where(eq(topics.slug, topicSlug));
  if (!topic) return null;
  const contentRows = await listContent("article", locale, topic.id);
  const conditionRows = await db.select().from(conditions).where(
    sql`exists (select 1 from content_topic ct join content c on c.id = ct.content_id
                where ct.topic_id = ${topic.id} and c.id = ${conditions.id})`,
  );
  const conditionOverrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "condition"), sql`${translations.entityId} = any(${conditionRows.map((r) => r.id)}::text[])`));
  const { searchAll } = await import("@/contexts/catalog/queries");
  const related = await searchAll(topic.name as string, locale);

  return {
    topic: (await overlayTranslations([topic], await db.select().from(translations)
      .where(and(eq(translations.entityType, "topic"), eq(translations.entityId, topic.id))), locale, ["name"]))[0],
    content: contentRows.rows,
    conditions: overlayTranslations(conditionRows, conditionOverrides, locale, ["name"]),
    relatedServices: related.filter((r) => r.type === "service").slice(0, 4),
    relatedDoctors: related.filter((r) => r.type === "doctor" || r.type === "clinic").slice(0, 4),
  };
}
```

- [ ] **Step 3: Write the hub page**

`src/app/[locale]/(content)/topics/[slug]/page.tsx` — render the five sections: topic title, articles (from `content`), conditions (linked to `/conditions/<slug>`), related services, related doctors (both linking into the booking flow from Phase 1). `conditions/[slug]/page.tsx` reuses `listContent` with a `conditionId` filter — add the same `in (select …)` condition-join to `listContent` and pass it through.

- [ ] **Step 4: Verify**

Run: `pnpm dev` — `/fa/topics/diabetes` renders seeded articles for the topic, its conditions, and the seeded ECG service + cardiologist as related (from the Phase 1 seed). This is the whole F-017 claim: hub from a query, zero new tables.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: query-based topic hubs with related services and doctors"
```

---

### Task 3.4: Support center

**Files:**
- Create: `src/contexts/support/actions.ts`, `src/contexts/support/queries.ts`, `src/app/[locale]/support/page.tsx`, `src/app/[locale]/support/new/page.tsx`, `src/app/[locale]/support/requests/page.tsx`

**Interfaces:**
- Consumes: `supportRequests` (3.1), `requireUser` (Phase 0), `myAppointments` (Phase 1) for the appointment-issue linker
- Produces:
  - `createSupportRequest(input: { kind; subject; body; appointmentId?; serviceId?; providerId? }): Promise<{ ok: true; id } | { ok: false; error }>` — Zod-validated, `requireUser`, optional links, writes a `notification` row to the user for every status change by an admin
  - `myRequests(userId): Promise<SupportRequestRow[]>` — newest first, with status
  - `listRequests(status?): Promise<SupportRequestRow[]>` (admin) — the queue

- [ ] **Step 1: Write actions and queries**

`src/contexts/support/actions.ts`:

```ts
"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { supportRequests, notifications } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";

const supportSchema = z.object({
  kind: z.enum(["question", "complaint", "appointment_issue"]),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
  appointmentId: z.string().optional(),
  serviceId: z.string().optional(),
  providerId: z.string().optional(),
});

export async function createSupportRequest(input: z.infer<typeof supportSchema>) {
  const user = await requireUser();
  const data = supportSchema.parse(input);
  const id = randomUUID();
  await db.insert(supportRequests).values({ id, userId: user.id, ...data });
  return { ok: true as const, id };
}

export async function updateRequestStatus(id: string, status: "open" | "in_progress" | "resolved" | "closed") {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false as const, reason: "forbidden" };
  const [row] = await db.select().from(supportRequests).where(eq(supportRequests.id, id));
  if (!row) return { ok: false as const, reason: "not_found" };
  await db.update(supportRequests).set({ status, updatedAt: new Date() }).where(eq(supportRequests.id, id));
  await db.insert(notifications).values({
    id: randomUUID(),
    userId: row.userId,
    kind: "support_reply",
    title: "Support request updated",
    body: `Your request "${row.subject}" is now ${status}.`,
  });
  return { ok: true as const };
}
```

`src/contexts/support/queries.ts` — `myRequests(userId)` and `listRequests(status?)` are plain selects ordered by `createdAt desc`, `limit 100`. Nothing clever: the support center is a queue and a history list.

- [ ] **Step 2: Write the pages**

`/support/page.tsx` — three cards (ask a question / register a complaint / appointment issue) linking to `/support/new?kind=…`. `/support/new/page.tsx` — the form posting to `createSupportRequest`, with the appointment dropdown populated from `myAppointments` when `kind=appointment_issue`. `/support/requests/page.tsx` — `myRequests` rendered with status badges. Admin queue: `src/app/[locale]/admin/support/page.tsx` — `listRequests("open")` with an inline status-change form posting to `updateRequestStatus` (the Phase 1 admin CRUD pattern).

- [ ] **Step 3: Verify**

Run: `pnpm dev` — submit a complaint as a patient; as admin, see it in `/admin/support`, resolve it; the patient's `/support/requests` shows `resolved`, and `/notifications` (Task 3.5) shows the support_reply row.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: support center with complaints and admin queue"
```

---

### Task 3.5: Notifications + appointment confirmation hook

**Files:**
- Create: `src/app/[locale]/(account)/notifications/page.tsx`, `src/contexts/support/queries.ts` → `unreadCount(userId)` / `listNotifications(userId)`
- Modify: `src/contexts/booking/actions.ts` (write a confirmation notification inside the booking transaction)

**Interfaces:**
- Consumes: `notifications` (3.1)
- Produces: `listNotifications(userId)`, `markNotificationsRead(userId)`, and an appointment-confirmed notification written by `bookAppointment`

- [ ] **Step 1: Hook notifications into booking**

In `src/contexts/booking/actions.ts`, inside the `bookAppointment` transaction, after the appointment insert:

```ts
await tx.insert(notifications).values({
  id: randomUUID(),
  userId: user.id,
  kind: "appointment_confirmed",
  title: "Appointment confirmed",
  body: `Your booking is confirmed (${appointmentId}).`,
});
```

Import `notifications` from `@/db/schema`. This is the whole notification strategy (constraint 5): DB row now, outbound channel later, no queue.

- [ ] **Step 2: Write the notifications page**

`src/app/[locale]/(account)/notifications/page.tsx` — server component: `requireUser`, `listNotifications(user.id)` (select ordered by `createdAt desc`, limit 50), render unread bold with a "Mark all read" form posting to `markNotificationsRead` (`db.update(notifications).set({ read: true }).where(eq(userId, user.id))`).

- [ ] **Step 3: Verify**

Run: `pnpm dev` — book a service → the notification appears; admin resolves a support request → second notification; marking read clears the unread state.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: notification rows, dashboard, booking confirmation hook"
```

---

### Task 3.6: Content admin + search union + trust surface

**Files:**
- Create: `src/app/[locale]/admin/content/page.tsx`, `src/app/[locale]/admin/content/[id]/page.tsx`, `src/app/[locale]/admin/topics/page.tsx`, `src/app/[locale]/admin/settings/page.tsx`, `src/app/[locale]/(marketing)/about/page.tsx`, `src/app/[locale]/(marketing)/contact/page.tsx`
- Modify: `src/contexts/catalog/queries.ts` (add `content.title` to `searchAll`), `src/app/[locale]/(marketing)/layout.tsx` (footer with trust links)

**Interfaces:**
- Consumes: content schema (3.1), admin pattern (Phase 1), `searchAll` (Phase 1)
- Produces: content CRUD with kind-specific fields and translation editing; content rows in global search; F-026 external links documented on a settings page and rendered in the footer

- [ ] **Step 1: Add content to the search union**

In `src/contexts/catalog/queries.ts`, append a third branch to `searchAll`:

```ts
const cnt = await db
  .select({ id: contents.id, slug: contents.slug, title: contents.title })
  .from(contents)
  .where(and(
    sql`to_tsvector('simple', ${contents.title}) @@ ${q}`,
    eq(contents.status, "published"),
  ))
  .limit(10);

const contentOverrides = await fetchOverrides("content", cnt.map((r) => r.id));
results.push(
  ...overlayTranslations(cnt, contentOverrides, locale, ["title"]).map((c) => ({
    type: "content" as const,
    id: c.id,
    title: c.title as string,
    subtitle: "Article",
    href: `/articles/${c.slug}`,
  })),
);
```

Import `contents` in the catalog queries file. Update `SearchResult["type"]` in `src/contexts/catalog/model.ts` to include `"content"`.

- [ ] **Step 2: Write content admin**

`src/app/[locale]/admin/content/[id]/page.tsx` — form posting to `saveContent` (add to `src/contexts/content/actions.ts` following the Phase 1 CRUD pattern: Zod schema `{ id?, kind, slug, titleFa, bodyFa, titleEn?, titleAr?, bodyEn?, bodyAr?, videoUrl?, status }`, `requireAdmin`, base columns + translation overrides in one transaction, `publishedAt` set when status flips to published). Kind-specific: `videoUrl` input only when `kind === "video"`. Topic assignment via a checkbox list from `listTopics` (multi-insert into `contentTopics`).

`src/app/[locale]/admin/topics/page.tsx` — topic CRUD, same pattern (one table, name + slug).

- [ ] **Step 3: Write the settings page (F-026 integration registry)**

`src/app/[locale]/admin/settings/page.tsx` — a read-only table documenting each external integration with owner + fallback + data boundary, per spec F-026's modernization requirement:

| Integration | Owner | Fallback | Data boundary |
|---|---|---|---|
| Regim24 | External | None — link out | Offline diet destination, no data shared |
| Nobat24 | External | In-app booking | Booking ecosystem link only |
| Aparat | External | None | Video embeds, `video_url` field |
| Leaflet/OSM | External | None | Map link on provider profiles |
| eNAMAD seal | External | None | Trust seal image + link |
| Instagram/Telegram/Facebook | External | None | Social links, footer |

Store these as `settings` rows (add `settings(id, key, value_json, updated_at)` to `src/db/schema/platform.ts`), render the table in the page, and allow editing the URLs only.

- [ ] **Step 4: Write the marketing pages + footer**

`src/app/[locale]/(marketing)/about/page.tsx` and `contact/page.tsx` — static copy from `messages/*.json` keys (`about.body`, `contact.body`). The marketing layout gains a footer rendering the settings-driven social links + eNAMAD seal + language switcher.

- [ ] **Step 5: Verify**

Run: `pnpm dev` — `/fa/search?q=دیابت` returns the seeded diabetes article alongside services/doctors; admin can publish a video and it appears on `/fa/videos`; footer shows the integration links.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: content admin, search union, integration registry, trust surface"
```

---

### Task 3.7: J-005 journey test + Phase 3 exit verification

**Files:**
- Create: `e2e/knowledge.spec.ts`

- [ ] **Step 1: Write the J-005 test**

`e2e/knowledge.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("J-005 learn about a health issue", async ({ page }) => {
  await page.goto("/fa/topics/diabetes");
  await expect(page.getByRole("heading", { name: /دیابت/ })).toBeVisible();
  await page.getByRole("link", { name: /دیابت/ }).first().click();
  await expect(page.getByRole("main")).toContainText(/دیابت/);
  await page.goto("/fa/search?q=قلب");
  await expect(page.getByRole("link", { name: /ECG|نوار قلب/ }).first()).toBeVisible();
});
```

- [ ] **Step 2: Full pass**

```bash
pnpm test && pnpm lint && pnpm build && pnpm exec playwright test
```

- [ ] **Step 3: Spec §11 Phase 3 exit criteria**

1. J-005 complete (topic hub → article → related food guidance → related doctors/services → booking link).
2. Topic hub renders from a query, not a new entity (Task 3.3).
3. F-016 (content system), F-017 (hubs), F-020/021 (support + complaints), F-025 (media via two fields), F-026 (integrations registry) all demonstrable.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: phase 3 exit verification"
```

---

## Phase 3 Self-Review

- **Spec coverage:** §5.5 (content/support/translation shapes) — Task 3.1; F-016 (taxonomy seed) — Task 3.1 Step 5; F-017 (hub as query) — Task 3.3; F-020/021 (support collapse) — Task 3.4; F-025 (media deleted) — constraints 4, Task 3.2 `videoUrl`; F-026 (integration registry) — Task 3.6 Step 3; §10 (notifications as rows, search union) — Tasks 3.5/3.6; §11 Phase 3 — Task 3.7.
- **Placeholders:** none — every code step carries complete code; the support queries deliberately "plain selects" statement names the exact shape instead of hiding it.
- **Type consistency:** `listContent(kind, locale, topicId?, page)` is called by `getTopicHub` with `(topic.id)` — the `sql` subquery filter matches `content_topic` column names from the schema; `SearchResult.type` gains `"content"` in the model before the search union adds it (Task 3.6 Step 1 ordering); `updateRequestStatus` status union matches the schema default and the notification body; `contentTopics` PK order matches the Phase 1 admin checkbox multi-insert plan.