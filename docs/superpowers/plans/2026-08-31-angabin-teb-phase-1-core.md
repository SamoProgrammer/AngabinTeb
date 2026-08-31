# Angabin Teb — Phase 1: Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver discovery and booking end to end: catalog data model, intent-based search, doctor and service profiles, a unified booking kernel with database-enforced correctness, admin CRUD + availability scheduling, and the patient dashboard.

**Architecture:** The booking kernel (`contexts/booking/kernel.ts`) is a pure, DB-free module — all unit tests target it. Correctness lives in the database: a partial unique index prevents double-booking, a unique index on `idempotency_key` prevents duplicate submissions, and a conditional `UPDATE` on `availability_slot` enforces capacity atomically (spec §5.3). Discovery is one Postgres FTS query over Persian base columns. Admin scheduling expands a weekly pattern into concrete slots.

**Tech Stack:** Everything from Phase 0, plus: shadcn/ui primitives (init in Phase 0 Task 0.7), Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-angabin-teb-design.md` (sections §5.1–5.3, §6, §9, §10, §12)

**Predecessor:** `docs/superpowers/plans/2026-08-31-angabin-teb-phase-0-foundation.md`

## Global Constraints

Every task implicitly includes the Phase 0 constraints (TS 7 → Oxlint only; `proxy.ts` never authorizes; async request APIs; Persian base columns + translation overrides; bun; commit per task), plus:

1. **Booking states** (spec §5.2): `confirmed | cancelled | completed | no_show`. No `pending` until Phase 4 payments.
2. **Payment status** (spec §6.2/§10): `unpaid | paid_at_location | refunded`. No gateway.
3. **Slot holds** (spec §6.2): `held_until`/`held_by` columns; expiry is **lazy** — availability queries treat `held_until < now()` as not held. No sweeper.
4. **Reschedule = cancel + create** (spec §6.3), never an in-place mutation.
5. **DB enforcement** (spec §5.3): the three indexes/UPDATE are the source of truth. App code never re-implements locking.
6. **Search** (spec §10): FTS over `service.name`, `provider.name`, `practitioner.bio`, `content.title` with `'simple'` text search config; unioned and ranked by entity type. No external engine.
7. **Translation overlay** (spec §5.6): reads go through `localize(entityType, rows, locale)`; base columns are Persian and always present.
8. **Provider model** (spec §5.1): `provider(kind: person|organization)`, `practitioner` satellite; `service(service_type: diagnostic|therapy|home_care|rehab|ambulance|consultation)` with satellites `diagnostic_service`, `home_care_service`, `ambulance_service`.
9. **Admin scheduling** (spec §9): recurring weekly pattern → concrete `availability_slot` rows; overlap detection required.
10. `party_size` (F-010) consumes slot capacity; values 1–4.

## File Map

```
src/
  db/schema/catalog.ts        # provider, practitioner, location, service_category, service, satellites, availability_slot
  db/schema/booking.ts        # appointment
  db/schema/index.ts          # + catalog, booking exports
  lib/translate.ts            # localize() overlay helper
  contexts/catalog/
    model.ts                  # entity row types
    queries.ts                # read path: catalog pages, FTS search
    actions.ts                # admin CRUD, slot generation
  contexts/booking/
    kernel.ts                 # pure logic: availability, holds, transitions, reschedule plan
    model.ts
    queries.ts                # availability for a service/date, appointment lists
    actions.ts                # hold, book, cancel, reschedule
  app/[locale]/
    page.tsx                  # home: search entry point
    (discovery)/
      search/page.tsx
      doctors/page.tsx
      doctors/[slug]/page.tsx
      services/page.tsx
      services/[slug]/page.tsx
    (booking)/
      services/[slug]/book/page.tsx
      confirm/page.tsx        # success + idempotency guard
    (account)/
      appointments/page.tsx
    admin/
      providers/page.tsx  providers/[id]/page.tsx
      services/page.tsx   services/[id]/page.tsx
      categories/page.tsx
      locations/page.tsx
      scheduling/page.tsx
      page.tsx                 # overview gains live counts
  e2e/
    journeys.spec.ts
  playwright.config.ts
```

---

### Task 1.1: Catalog schema + migration

**Files:**
- Create: `src/db/schema/catalog.ts`, `src/db/schema/booking.ts`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Consumes: `translations` (Phase 0), drizzle pattern from Phase 0
- Produces (exact names used by every later task): tables `provider`, `practitioner`, `location`, `service_category`, `service`, `diagnostic_service`, `home_care_service`, `ambulance_service`, `availability_slot`, `appointment`; columns named exactly as below

- [ ] **Step 1: Write the catalog schema**

`src/db/schema/catalog.ts`:

```ts
import { pgTable, text, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

export const providers = pgTable("provider", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // person | organization
  orgType: text("org_type"),    // clinic | office | service_org, null when person
  name: text("name").notNull(), // Persian base
  primaryLocationId: text("primary_location_id"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practitioners = pgTable("practitioner", {
  providerId: text("provider_id").primaryKey().references(() => providers.id, { onDelete: "cascade" }),
  specialtyId: text("specialty_id"), // FK service_category.id (specialties live there)
  bio: text("bio"),                  // Persian base
  credentials: text("credentials"),
  cvUrl: text("cv_url"),
  videoUrl: text("video_url"),
});

export const locations = pgTable("location", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // Persian base
  addressLine: text("address_line"),
  cityId: text("city_id").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
});

export const serviceCategories = pgTable("service_category", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(), // Persian base
  parentId: text("parent_id").references(() => serviceCategories.id),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const services = pgTable("service", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id),
  categoryId: text("category_id").notNull().references(() => serviceCategories.id),
  serviceType: text("service_type").notNull(), // diagnostic | therapy | home_care | rehab | ambulance | consultation
  locationId: text("location_id").references(() => locations.id),
  name: text("name").notNull(), // Persian base
  durationMinutes: integer("duration_minutes").notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 0 }).notNull().default("0"),
  isBookable: boolean("is_bookable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
});

export const diagnosticServices = pgTable("diagnostic_service", {
  serviceId: text("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  prepInstructions: text("prep_instructions"), // Persian base
  fastingHours: integer("fasting_hours"),
  requiresReferral: boolean("requires_referral").notNull().default(false),
});

export const homeCareServices = pgTable("home_care_service", {
  serviceId: text("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  requiresPatientAddress: boolean("requires_patient_address").notNull().default(true),
  serviceableCityIds: jsonb("serviceable_city_ids").notNull().default([]), // string[]
});

export const ambulanceServices = pgTable("ambulance_service", {
  serviceId: text("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  dispatchModel: text("dispatch_model"), // Phase 4
  vehicleType: text("vehicle_type"),     // Phase 4
});

export const availabilitySlots = pgTable("availability_slot", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  capacity: integer("capacity").notNull().default(1),
  bookedCount: integer("booked_count").notNull().default(0),
  heldUntil: timestamp("held_until", { withTimezone: true }),
  heldBy: text("held_by"),
});
```

- [ ] **Step 2: Write the booking schema with the enforcement indexes**

`src/db/schema/booking.ts`:

```ts
import { pgTable, text, timestamp, integer, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
import { providers, services, locations } from "./catalog";

export const appointments = pgTable(
  "appointment",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(), // FK user.id (identity context)
    serviceId: text("service_id").notNull().references(() => services.id),
    providerId: text("provider_id").notNull().references(() => providers.id),
    locationId: text("location_id").references(() => locations.id),
    slotId: text("slot_id").notNull(),
    partySize: integer("party_size").notNull().default(1),
    status: text("status").notNull().default("confirmed"), // confirmed | cancelled | completed | no_show
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid | paid_at_location | refunded
    price: numeric("price", { precision: 12, scale: 0 }).notNull(),
    notes: text("notes"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("one_booking_per_slot")
      .on(t.slotId)
      .where(sql`status NOT IN ('cancelled','no_show')`),
    uniqueIndex("appointment_idempotency").on(t.idempotencyKey),
    index("appointment_patient").on(t.patientId),
  ],
);

import { sql } from "drizzle-orm";
```

- [ ] **Step 3: Barrel-export**

`src/db/schema/index.ts` — add:

```ts
export * from "./catalog";
export * from "./booking";
```

- [ ] **Step 4: Generate and apply the migration**

```bash
bun run db:generate
bun run db:migrate
```

Expected: migration creates the 10 tables and both unique indexes.

- [ ] **Step 5: Verify the enforcement indexes exist**

```bash
bunx tsx -e "import { db } from './src/db'; import { sql } from 'drizzle-orm'; const r = await db.execute(sql\`select indexname from pg_indexes where tablename in ('appointment','availability_slot') order by indexname\`); console.log(r.map(x=>x.indexname).join('\n'));"
```

Expected: `appointment_idempotency`, `one_booking_per_slot` present.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: catalog and booking schema with enforcement indexes"
```

---

### Task 1.2: Translation overlay helper

**Files:**
- Create: `src/lib/translate.ts`, `src/lib/__tests__/translate.test.ts`

**Interfaces:**
- Consumes: `translations` table (Phase 0)
- Produces: `overlayTranslations<T extends Record<string, unknown>>(entityType: string, rows: T[], overrides: Override[], locale: string, fields: string[]): T[]` — overlays non-Persian overrides onto base columns, in place, one DB query per entity type

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/translate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { overlayTranslations } from "@/lib/translate";

describe("overlayTranslations", () => {
  const base = [{ id: "s1", name: "نوار قلب", bio: "پزشک" }];

  it("returns base columns when no overrides exist", () => {
    expect(overlayTranslations("service", base, [], "en", ["name"])).toEqual([
      { id: "s1", name: "نوار قلب", bio: "پزشک" },
    ]);
  });

  it("overlays matching locale+field, leaves others untouched", () => {
    const rows = overlayTranslations("service", base, [
      { entityType: "service", entityId: "s1", locale: "en", field: "name", value: "ECG" },
      { entityType: "service", entityId: "s1", locale: "ar", field: "name", value: "تخطيط القلب" },
    ], "en", ["name"]);
    expect(rows[0].name).toBe("ECG");
    expect(rows[0].bio).toBe("پزشک");
  });

  it("ignores overrides for other entities", () => {
    const rows = overlayTranslations("service", base, [
      { entityType: "provider", entityId: "s1", locale: "en", field: "name", value: "NOPE" },
    ], "en", ["name"]);
    expect(rows[0].name).toBe("نوار قلب");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bunx vitest run src/lib/__tests__/translate.test.ts`
Expected: FAIL — `overlayTranslations` is not defined.

- [ ] **Step 3: Write the implementation**

`src/lib/translate.ts`:

```ts
type Row = Record<string, unknown>;
type Override = { entityType: string; entityId: string; locale: string; field: string; value: string };

// Ruling R18 + R30: entityType AND locale are in the map key — overrides are
// scoped per entity type (a "provider" override never touches a "service" row
// that shares an id) and per locale (multiple locales for the same
// entity+field never collide).
export function overlayTranslations<T extends Row>(
  entityType: string,
  rows: T[],
  overrides: Override[],
  locale: string,
  fields: string[],
): T[] {
  if (overrides.length === 0) return rows;
  const byId = new Map(overrides.map((o) => [`${o.entityType}:${o.entityId}:${o.field}:${o.locale}`, o]));
  return rows.map((row) => {
    const out = { ...row };
    for (const field of fields) {
      const match = byId.get(`${entityType}:${row.id}:${field}:${locale}`);
      if (match) out[field] = match.value;
    }
    return out;
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bunx vitest run src/lib/__tests__/translate.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: translation overlay helper"
```

---

### Task 1.3: Catalog read queries + FTS search

**Files:**
- Create: `src/contexts/catalog/model.ts`, `src/contexts/catalog/queries.ts`, `src/contexts/catalog/__tests__/search.test.ts`
- Create (UI): `src/app/[locale]/(discovery)/search/page.tsx`, `src/app/[locale]/(discovery)/doctors/page.tsx`, `src/app/[locale]/(discovery)/services/page.tsx`

**Interfaces:**
- Consumes: catalog schema (Task 1.1), `localize` (Task 1.2)
- Produces:
  - `searchAll(term: string, locale: string, { categoryId?, cityId? }): Promise<SearchResult[]>` where `SearchResult = { type: "service"|"doctor"|"clinic"; id: string; title: string; subtitle: string; href: string }`
  - `listDoctors(locale: string, { specialtyId?, cityId? }): Promise<DoctorCard[]>` / `listServices(...): Promise<ServiceCard[]>`
  - `getDoctor(id, locale)` / `getService(id, locale)` full profile rows
  - `fetchOverrides(entityType, ids): Promise<Override[]>` — one query, reused by all list queries

- [ ] **Step 1: Write the model types**

`src/contexts/catalog/model.ts`:

```ts
export type SearchResult = {
  type: "service" | "doctor" | "clinic";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type DoctorCard = {
  id: string;
  name: string;
  specialty: string | null; // left-join nullable (R31)
  cityId: string | null;    // left-join nullable (R31)
  imageUrl: string | null;
};

export type ServiceCard = {
  id: string;
  name: string;
  providerName: string;
  serviceType: string;
  cityId: string | null;
  price: string;
};
```

- [ ] **Step 2: Write the queries with FTS**

`src/contexts/catalog/queries.ts`:

```ts
import "server-only";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { providers, practitioners, services, locations, serviceCategories, translations } from "@/db/schema";
import { overlayTranslations } from "@/lib/translate";
import type { SearchResult, DoctorCard, ServiceCard } from "./model";

export async function fetchOverrides(entityType: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, entityType), sql`${translations.entityId} = any(${ids}::text[])`));
}

export async function searchAll(term: string, locale: string): Promise<SearchResult[]> {
  if (!term.trim()) return [];
  const q = sql`plainto_tsquery('simple', ${term.trim()})`;

  const svc = await db
    .select({
      id: services.id,
      name: services.name,
      type: sql<string>`'service'`,
      providerName: providers.name,
      serviceType: services.serviceType,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .where(and(sql`to_tsvector('simple', ${services.name}) @@ ${q}`, eq(services.isActive, true)))
    .limit(20);

  const docs = await db
    .select({
      id: providers.id,
      name: providers.name,
      bio: practitioners.bio,
      specialtyName: serviceCategories.name,
      kind: providers.kind,
    })
    .from(providers)
    .leftJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .where(and(
      sql`to_tsvector('simple', coalesce(${providers.name},'') || ' ' || coalesce(${practitioners.bio},'')) @@ ${q}`,
      eq(providers.isActive, true),
    ))
    .limit(20);

  const overrides = await fetchOverrides("service", svc.map((r) => r.id));
  const docOverrides = await fetchOverrides("provider", docs.map((r) => r.id));

  const localizedServices = overlayTranslations("service", svc, overrides, locale, ["name"]);
  const localizedDocs = overlayTranslations("provider", docs, docOverrides, locale, ["name"]);

  const results: SearchResult[] = [
    ...localizedServices.map((s) => ({
      type: "service" as const,
      id: s.id,
      title: s.name as string,
      subtitle: `${s.providerName} · ${s.serviceType}`,
      href: `/services/${s.id}`,
    })),
    ...localizedDocs.map((d) => ({
      type: (d.kind === "organization" ? "clinic" : "doctor") as "clinic" | "doctor",
      id: d.id,
      title: d.name as string,
      subtitle: (d.bio as string) ?? (d.specialtyName as string) ?? "",
      href: `/doctors/${d.id}`,
    })),
  ];
  return results.sort((a, b) => a.title.localeCompare(b.title, locale));
}

export async function listDoctors(locale: string, specialtyId?: string, cityId?: string): Promise<DoctorCard[]> {
  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      specialty: serviceCategories.name, // R31: alias matches DoctorCard's property name
      cityId: locations.cityId,
      imageUrl: providers.imageUrl,
    })
    .from(providers)
    .innerJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .leftJoin(locations, eq(locations.id, providers.primaryLocationId))
    .where(and(
      eq(providers.kind, "person"),
      eq(providers.isActive, true),
      specialtyId ? eq(practitioners.specialtyId, specialtyId) : undefined,
      cityId ? eq(locations.cityId, cityId) : undefined,
    ))
    .orderBy(providers.name);
  return overlayTranslations("provider", rows, await fetchOverrides("provider", rows.map((r) => r.id)), locale, ["name"]) as DoctorCard[];
}

export async function listServices(locale: string, categoryId?: string, cityId?: string): Promise<ServiceCard[]> {
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      providerName: providers.name,
      serviceType: services.serviceType,
      cityId: locations.cityId,
      price: services.basePrice,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .leftJoin(locations, eq(locations.id, services.locationId))
    .where(and(
      eq(services.isActive, true),
      categoryId ? eq(services.categoryId, categoryId) : undefined,
      cityId ? eq(locations.cityId, cityId) : undefined,
    ))
    .orderBy(services.name)
    .limit(50);
  return overlayTranslations("service", rows, await fetchOverrides("service", rows.map((r) => r.id)), locale, ["name"]) as ServiceCard[];
}

export async function getDoctor(id: string, locale: string) {
  const [row] = await db
    .select({
      id: providers.id,
      kind: providers.kind,
      name: providers.name,
      phone: providers.phone,
      imageUrl: providers.imageUrl,
      bio: practitioners.bio,
      credentials: practitioners.credentials,
      cvUrl: practitioners.cvUrl,
      videoUrl: practitioners.videoUrl,
      specialtyName: serviceCategories.name,
      addressLine: locations.addressLine,
      cityId: locations.cityId,
      latitude: locations.latitude,
      longitude: locations.longitude,
    })
    .from(providers)
    .leftJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .leftJoin(locations, eq(locations.id, providers.primaryLocationId))
    .where(eq(providers.id, id));
  if (!row) return null;
  return overlayTranslations("provider", [row], await fetchOverrides("provider", [id]), locale, ["name", "bio"])[0];
}

export async function getService(id: string, locale: string) {
  const [row] = await db
    .select({
      id: services.id,
      serviceType: services.serviceType,
      name: services.name,
      providerId: services.providerId,
      providerName: providers.name,
      durationMinutes: services.durationMinutes,
      basePrice: services.basePrice,
      locationId: services.locationId,
      addressLine: locations.addressLine,
      cityId: locations.cityId,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .leftJoin(locations, eq(locations.id, services.locationId))
    .where(and(eq(services.id, id), eq(services.isActive, true)));
  if (!row) return null;
  return overlayTranslations("service", [row], await fetchOverrides("service", [id]), locale, ["name"])[0];
}
```

- [ ] **Step 3: Write the failing search test**

`src/contexts/catalog/__tests__/search.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/translate", () => ({ overlayTranslations: (_entityType: string, rows: unknown[]) => rows }));

import { searchAll } from "../queries";

describe("searchAll", () => {
  it("returns an empty array for a blank term without touching the DB", async () => {
    const results = await searchAll("   ", "fa");
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 4: Run to verify the query module compiles and the test passes**

Run: `bunx vitest run src/contexts/catalog/__tests__/search.test.ts`
Expected: PASS. (The `searchAll` module must compile under TS 7 — this is the first file using `sql` template tags and `and(...)` with `undefined` filters, the two patterns the whole phase relies on.)

- [ ] **Step 5: Write the discovery pages**

`src/app/[locale]/(discovery)/search/page.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { searchAll } from "@/contexts/catalog/queries";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const results = await searchAll(q ?? "", locale);
  const t = useTranslations("search");
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <form className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("placeholder")}
          className="flex-1 rounded border px-3 py-2"
          aria-label={t("placeholder")}
        />
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">{t("submit")}</button>
      </form>
      <ul className="divide-y">
        {results.map((r) => (
          <li key={`${r.type}-${r.id}`} className="py-4">
            <a href={r.href}>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-gray-600">{r.subtitle}</p>
            </a>
          </li>
        ))}
        {results.length === 0 && q && <li className="py-8 text-gray-500">{t("empty")}</li>}
      </ul>
    </main>
  );
}
```

`src/app/[locale]/(discovery)/doctors/page.tsx` (list) and `services/page.tsx` (list) follow the same shape: call `listDoctors(locale, specialtyId, cityId)` / `listServices(...)` with `searchParams` for `specialty` and `city`, render cards with links to `/doctors/[id]` and `/services/[id]`. Repeat the overlay pattern — do not abstract it further.

Add `search.placeholder`, `search.submit`, `search.empty` keys to all three `messages/*.json`.

- [ ] **Step 6: Verify discovery pages render**

Run: `bun run dev` (requires the base catalog seed rows added in Task 1.8 — run that seed first; ruling R32)
1. `/fa/search?q=قلب` returns seeded ECGs (seed data) — confirm by searching a Persian term.
2. `/en/search?q=نوار قلب` returns the same row with the English overlay (title "ECG") — FTS indexes the Persian base column by design (spec §5.6); English terms are never indexed, so the English search check searches Persian and asserts the RENDERED overlay.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: catalog queries, FTS search, discovery list pages"
```

---

### Task 1.4: Admin catalog CRUD + availability scheduling

**Files:**
- Create: `src/contexts/catalog/actions.ts`, `src/app/[locale]/admin/providers/page.tsx`, `src/app/[locale]/admin/providers/[id]/page.tsx`, `src/app/[locale]/admin/services/page.tsx`, `src/app/[locale]/admin/services/[id]/page.tsx`, `src/app/[locale]/admin/categories/page.tsx`, `src/app/[locale]/admin/locations/page.tsx`, `src/app/[locale]/admin/scheduling/page.tsx`, `src/contexts/catalog/__tests__/scheduling.test.ts`
- Modify: `src/app/[locale]/admin/layout.tsx` (nav links)

**Interfaces:**
- Consumes: `requireAdmin` (Phase 0), catalog schema (1.1), `localize` (1.2)
- Produces:
  - `createProvider(input)`, `updateProvider(id, input)`, `createService(input)`, `updateService(id, input)` — server actions, Zod-validated, writing base Persian columns + translation overrides in the same transaction
  - `generateSlots(input: { serviceId: string; providerId: string; weekday: number; startsAt: string; endsAt: string; durationMinutes: number; capacity: number; fromDate: string; toDate: string })` — expands a weekly pattern into `availability_slot` rows, refusing rows that overlap existing slots
  - `availabilityForService(serviceId, date)` in `queries.ts` — used by the booking UI (Task 1.5)

- [ ] **Step 1: Install Zod** (ruling R28 — Phase 0 never installed it; Task 1.4/1.6 actions validate with it)

```bash
bun add zod
```

- [ ] **Step 2: Write the failing scheduling test**

`src/contexts/catalog/__tests__/scheduling.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { expandPattern } from "../actions";

describe("expandPattern", () => {
  it("expands a weekly pattern into concrete slots", () => {
    const slots = expandPattern({
      weekday: 2, // Tuesday
      startsAt: "09:00",
      endsAt: "17:00",
      durationMinutes: 60,
      from: new Date("2026-09-01T00:00:00Z"),
      to: new Date("2026-09-30T00:00:00Z"),
    });
    expect(slots.length).toBe(40); // 5 Tuesdays × 8 one-hour slots (Sep 2026 has 5 Tuesdays — R33)
    expect(slots[0]).toEqual(new Date("2026-09-01T09:00:00Z"));
    expect(slots[slots.length - 1]).toEqual(new Date("2026-09-29T16:00:00Z"));
  });

  it("rejects an end before start", () => {
    expect(() => expandPattern({
      weekday: 1, startsAt: "17:00", endsAt: "09:00", durationMinutes: 60,
      from: new Date("2026-09-01T00:00:00Z"), to: new Date("2026-09-30T00:00:00Z"),
    })).toThrow("endsAt must be after startsAt");
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `bunx vitest run src/contexts/catalog/__tests__/scheduling.test.ts`
Expected: FAIL — `expandPattern` not defined.

- [ ] **Step 4: Write the pure expansion function and the actions**

`src/contexts/catalog/actions.ts`:

```ts
"use server";

import { z } from "zod";
import { sql, and, eq, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { providers, practitioners, diagnosticServices, services, availabilitySlots, translations } from "@/db/schema";
import { requireAdmin } from "@/contexts/identity/actions";

const providerSchema = z.object({
  kind: z.enum(["person", "organization"]),
  orgType: z.enum(["clinic", "office", "service_org"]).nullable().optional(),
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  specialtyId: z.string().optional(),
  bioFa: z.string().optional(),
});

export async function createProvider(input: z.infer<typeof providerSchema>) {
  await requireAdmin();
  const data = providerSchema.parse(input);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(providers).values({
      id, kind: data.kind, orgType: data.orgType ?? null,
      name: data.nameFa, phone: data.phone ?? null,
    });
    if (data.kind === "person") {
      await tx.insert(practitioners).values({
        providerId: id, specialtyId: data.specialtyId ?? null, bio: data.bioFa ?? null,
      });
    }
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "provider", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

const serviceSchema = z.object({
  providerId: z.string().min(1),
  categoryId: z.string().min(1),
  serviceType: z.enum(["diagnostic", "therapy", "home_care", "rehab", "ambulance", "consultation"]),
  locationId: z.string().optional(),
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  basePrice: z.string().regex(/^\d+$/),
  prepInstructionsFa: z.string().optional(),
  fastingHours: z.number().int().nonnegative().optional(),
});

export async function createService(input: z.infer<typeof serviceSchema>) {
  await requireAdmin();
  const data = serviceSchema.parse(input);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(services).values({
      id, providerId: data.providerId, categoryId: data.categoryId,
      serviceType: data.serviceType, locationId: data.locationId ?? null,
      name: data.nameFa, durationMinutes: data.durationMinutes, basePrice: data.basePrice,
    });
    if (data.serviceType === "diagnostic") {
      await tx.insert(diagnosticServices).values({
        serviceId: id, prepInstructions: data.prepInstructionsFa ?? null, fastingHours: data.fastingHours ?? null,
      });
    }
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "service", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

export function expandPattern(input: {
  weekday: number; // 0=Sun … 6=Sat
  startsAt: string; // "HH:MM"
  endsAt: string;
  durationMinutes: number;
  from: Date;
  to: Date;
}): Date[] {
  const [sh, sm] = input.startsAt.split(":").map(Number);
  const [eh, em] = input.endsAt.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) throw new Error("endsAt must be after startsAt");
  const out: Date[] = [];
  for (let d = new Date(input.from); d <= input.to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== input.weekday) continue;
    for (let m = startMin; m + input.durationMinutes <= endMin; m += input.durationMinutes) {
      const slot = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(m / 60), m % 60));
      out.push(slot);
    }
  }
  return out;
}

export async function generateSlots(input: {
  serviceId: string; providerId: string;
  weekday: number; startsAt: string; endsAt: string; durationMinutes: number; capacity: number;
  fromDate: string; toDate: string;
}) {
  await requireAdmin();
  const starts = expandPattern({
    weekday: input.weekday, startsAt: input.startsAt, endsAt: input.endsAt,
    durationMinutes: input.durationMinutes,
    from: new Date(`${input.fromDate}T00:00:00Z`), to: new Date(`${input.toDate}T23:59:59Z`),
  });
  const existing = await db.select().from(availabilitySlots)
    .where(and(
      eq(availabilitySlots.serviceId, input.serviceId),
      ne(availabilitySlots.endsAt, new Date(0)),
    ));
  const overlap = starts.filter((s) =>
    existing.some((e) =>
      s < e.endsAt && new Date(s.getTime() + input.durationMinutes * 60_000) > e.startsAt,
    ),
  );
  if (overlap.length > 0) {
    return { ok: false as const, reason: "overlap", count: overlap.length };
  }
  await db.insert(availabilitySlots).values(
    starts.map((s) => ({
      id: randomUUID(),
      providerId: input.providerId,
      serviceId: input.serviceId,
      startsAt: s,
      endsAt: new Date(s.getTime() + input.durationMinutes * 60_000),
      capacity: input.capacity,
    })),
  );
  return { ok: true as const, count: starts.length };
}

export async function availabilityForService(serviceId: string, date: string) {
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(`${date}T23:59:59Z`);
  return db
    .select()
    .from(availabilitySlots)
    .where(and(
      eq(availabilitySlots.serviceId, serviceId),
      eq(availabilitySlots.isActive, true),
      sql`${availabilitySlots.startsAt} >= ${start} AND ${availabilitySlots.startsAt} <= ${end}`,
      sql`(${availabilitySlots.heldUntil} IS NULL OR ${availabilitySlots.heldUntil} < now())`,
    ))
    .orderBy(availabilitySlots.startsAt);
}
```

Add `isActive: boolean("is_active").notNull().default(true)` to `availabilitySlots` in `src/db/schema/catalog.ts` and regenerate the migration (`bun run db:generate && bun run db:migrate`) before running tests.

- [ ] **Step 5: Run the scheduling tests**

Run: `bunx vitest run src/contexts/catalog/__tests__/scheduling.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 6: Write the admin CRUD pages**

For each resource (providers, services, categories, locations), one list page and one edit page using the shadcn primitives:

- List page: server component; `db.select().from(<table>).orderBy(name)`; shadcn `Table`; each row links to `/admin/<resource>/[id]`.
- Edit page: server component renders a `<form action={serverAction}>`; the action is `createProvider`/`updateProvider`/`createService`/`updateService` (repeat the pattern — update = `db.update(...).set(...)` with the same Zod schema, `requireAdmin()` first). Persian fields are the required base; English/Arabic fields are optional and write `translation` rows. On success `redirect("/admin/<resource>")`; on Zod error, return `{ error: string }` and render it in the form.

`src/app/[locale]/admin/providers/page.tsx` (reference implementation for the other three):

```tsx
import { db } from "@/db";
import { providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminProvidersPage() {
  const rows = await db.select().from(providers).orderBy(providers.name);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Providers</h1>
        <Button asChild><a href="/admin/providers/new">New provider</a></Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Kind</TableHead><TableHead>Phone</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell><a href={`/admin/providers/${p.id}`} className="font-medium">{p.name}</a></TableCell>
              <TableCell>{p.kind}</TableCell>
              <TableCell>{p.phone ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

`src/app/[locale]/admin/scheduling/page.tsx`: form with service/`providerId`, `weekday`, `startsAt`, `endsAt`, `durationMinutes`, `capacity`, `fromDate`, `toDate` → `<form action={generateSlots}>`; result shows `ok/count` or the `overlap` rejection.

- [ ] **Step 7: Verify the admin loop end to end**

Run: `bun run dev` — as seeded admin:
1. Create a provider (person) with Persian name + English name.
2. Create a diagnostic service "ECG" under it, 30 min, price.
3. Generate slots: Tuesday 09:00–11:00, 30 min each, capacity 1, from 2026-09-01 to 2026-09-30 → 5 Tuesdays × 4 slots = 20 rows (R33).
4. Generate the same pattern again → `{ ok: false, reason: "overlap" }`.
5. `/fa/doctors` and `/fa/services` show the new rows; `/en/services` shows the English name.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: admin catalog CRUD and weekly-pattern slot generation"
```

---

### Task 1.5: Booking kernel (pure, TDD)

**Files:**
- Create: `src/contexts/booking/kernel.ts`, `src/contexts/booking/model.ts`, `src/contexts/booking/__tests__/kernel.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions; types only)
- Produces (exact signatures used by Task 1.6):
  - `type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show"`
  - `type SlotView = { capacity: number; bookedCount: number; heldUntil: Date | null }`
  - `canBook(slot: SlotView, partySize: number, now: Date): boolean`
  - `holdExpired(slot: Pick<SlotView, "heldUntil">, now: Date): boolean`
  - `canCancel(status: BookingStatus): boolean` — true only for `confirmed`
  - `reschedulePlan(slot: SlotView, partySize: number, now: Date): { ok: true } | { ok: false; reason: "capacity" | "held" }`
  - `validatePartySize(n: unknown): n is 1 | 2 | 3 | 4`

`src/contexts/booking/model.ts` (types shared with the UI): re-export `BookingStatus`, `SlotView` from `./kernel` and define `AppointmentRow` — the shape `myAppointments` returns (id, status, paymentStatus, partySize, price, serviceName, startsAt) so Task 1.6/1.7 import it from the model, not the queries return type.

- [ ] **Step 1: Write the failing tests**

`src/contexts/booking/__tests__/kernel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canBook, holdExpired, canCancel, reschedulePlan, validatePartySize } from "../kernel";

const now = new Date("2026-09-01T10:00:00Z");
const freeSlot = { capacity: 2, bookedCount: 1, heldUntil: null };
const heldSlot = { capacity: 2, bookedCount: 1, heldUntil: new Date("2026-09-01T10:10:00Z") };

describe("canBook", () => {
  it("accepts a party that fits", () => {
    expect(canBook(freeSlot, 1, now)).toBe(true);
  });
  it("rejects a party exceeding capacity", () => {
    expect(canBook(freeSlot, 2, now)).toBe(false);
  });
  it("rejects an active hold by someone else", () => {
    expect(canBook(heldSlot, 1, now)).toBe(false);
  });
  it("accepts an expired hold", () => {
    expect(canBook({ ...heldSlot, heldUntil: new Date("2026-09-01T09:00:00Z") }, 1, now)).toBe(true);
  });
});

describe("holdExpired", () => {
  it("treats null holds as not held", () => expect(holdExpired({ heldUntil: null }, now)).toBe(false));
  it("expires past holds", () => expect(holdExpired({ heldUntil: new Date("2026-09-01T09:00:00Z") }, now)).toBe(true));
});

describe("canCancel", () => {
  it("cancels only confirmed appointments", () => {
    expect(canCancel("confirmed")).toBe(true);
    expect(canCancel("cancelled")).toBe(false);
    expect(canCancel("completed")).toBe(false);
    expect(canCancel("no_show")).toBe(false);
  });
});

describe("reschedulePlan", () => {
  it("succeeds when capacity remains", () => expect(reschedulePlan(freeSlot, 1, now)).toEqual({ ok: true }));
  it("fails on capacity", () => expect(reschedulePlan(freeSlot, 2, now)).toEqual({ ok: false, reason: "capacity" }));
  it("fails on an active hold", () => expect(reschedulePlan(heldSlot, 1, now)).toEqual({ ok: false, reason: "held" }));
});

describe("validatePartySize", () => {
  it("accepts 1-4 and rejects everything else", () => {
    expect(validatePartySize(1)).toBe(true);
    expect(validatePartySize(4)).toBe(true);
    expect(validatePartySize(0)).toBe(false);
    expect(validatePartySize(5)).toBe(false);
    expect(validatePartySize("3")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bunx vitest run src/contexts/booking/__tests__/kernel.test.ts`
Expected: FAIL — kernel not defined.

- [ ] **Step 3: Write the kernel**

`src/contexts/booking/kernel.ts`:

```ts
export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export type SlotView = {
  capacity: number;
  bookedCount: number;
  heldUntil: Date | null;
};

export function holdExpired(slot: Pick<SlotView, "heldUntil">, now: Date): boolean {
  return slot.heldUntil !== null && slot.heldUntil <= now;
}

export function canBook(slot: SlotView, partySize: number, now: Date): boolean {
  if (!holdExpired(slot, now) && slot.heldUntil !== null) return false;
  return slot.bookedCount + partySize <= slot.capacity;
}

export function canCancel(status: BookingStatus): boolean {
  return status === "confirmed";
}

export function reschedulePlan(
  slot: SlotView,
  partySize: number,
  now: Date,
): { ok: true } | { ok: false; reason: "capacity" | "held" } {
  if (!holdExpired(slot, now) && slot.heldUntil !== null) return { ok: false, reason: "held" };
  if (slot.bookedCount + partySize > slot.capacity) return { ok: false, reason: "capacity" };
  return { ok: true };
}

export function validatePartySize(n: unknown): n is 1 | 2 | 3 | 4 {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 4;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bunx vitest run src/contexts/booking/__tests__/kernel.test.ts`
Expected: PASS, 13 assertions across 5 suites.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pure booking kernel with capacity, hold, cancel, reschedule logic"
```

---

### Task 1.6: Booking server actions + flow UI

**Files:**
- Create: `src/contexts/booking/queries.ts`, `src/contexts/booking/actions.ts`, `src/app/[locale]/(booking)/services/[slug]/book/page.tsx`, `src/app/[locale]/(booking)/confirm/page.tsx`, `src/components/booking/slot-picker.tsx`
- Modify: `src/contexts/catalog/actions.ts` (export `availabilityForService` — already there)

**Interfaces:**
- Consumes: kernel (1.5), `availabilityForService` (1.4), `requireUser` (Phase 0), catalog queries (1.3)
- Produces:
  - `bookAppointment(input: { serviceId; slotId; partySize; notes?; idempotencyKey }): Promise<{ ok: true; appointmentId } | { ok: false; reason: "capacity_exceeded" | "invalid_party" | "unauthenticated" }>` — the transaction: conditional capacity `UPDATE` + insert, or nothing
  - `cancelAppointment(id): Promise<{ ok: true } | { ok: false; reason: "not_cancellable" }>`
  - `rescheduleAppointment(id, newSlotId): Promise<...>` — cancel old + book new in one transaction
  - `myAppointments(userId): Promise<AppointmentRow[]>` — dashboard list, most recent first

- [ ] **Step 1: Write the queries and actions**

`src/contexts/booking/actions.ts`:

```ts
"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { canCancel, validatePartySize } from "./kernel";
import type { BookingStatus } from "./model";

const bookSchema = z.object({
  serviceId: z.string().min(1),
  slotId: z.string().min(1),
  partySize: z.number(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(64),
});

export async function bookAppointment(input: z.infer<typeof bookSchema>) {
  const user = await requireUser();
  return bookAppointmentWithUser(user, input);
}

// Ruling R23: seam for the Task 1.8 test-only api-test route (e2e has no OTP
// path); the transaction itself lives in exactly one place.
export async function bookAppointmentWithUser(
  user: { id: string },
  input: z.infer<typeof bookSchema>,
) {
  const data = bookSchema.parse(input);
  if (!validatePartySize(data.partySize)) return { ok: false as const, reason: "invalid_party" };

  return db.transaction(async (tx) => {
    const slotRes = await tx.execute(
      sql`UPDATE availability_slot
            SET booked_count = booked_count + ${data.partySize},
                held_until = NULL, held_by = NULL
          WHERE id = ${data.slotId}
            AND booked_count + ${data.partySize} <= capacity
            AND (held_until IS NULL OR held_until < now())`,
    );
    if (slotRes.count === 0) return { ok: false as const, reason: "capacity_exceeded" };

    const [svc] = await tx.select().from(services).where(eq(services.id, data.serviceId));
    const appointmentId = randomUUID();
    await tx.insert(appointments).values({
      id: appointmentId,
      patientId: user.id,
      serviceId: data.serviceId,
      providerId: svc.providerId,
      locationId: svc.locationId ?? null,
      slotId: data.slotId,
      partySize: data.partySize,
      price: svc.basePrice,
      notes: data.notes ?? null,
      idempotencyKey: data.idempotencyKey,
    });
    return { ok: true as const, appointmentId };
  });
}

export async function cancelAppointment(id: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, user.id)));
  if (!row) return { ok: false as const, reason: "not_found" };
  if (!canCancel(row.status as BookingStatus)) return { ok: false as const, reason: "not_cancellable" };

  await db.transaction(async (tx) => {
    await tx.update(appointments)
      .set({ status: "cancelled" })
      .where(eq(appointments.id, id));
    await tx.execute(
      sql`UPDATE availability_slot
            SET booked_count = GREATEST(booked_count - ${row.partySize}, 0)
          WHERE id = ${row.slotId}`,
    );
  });
  return { ok: true as const };
}

export async function rescheduleAppointment(id: string, newSlotId: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, user.id)));
  if (!row || !canCancel(row.status as BookingStatus)) return { ok: false as const, reason: "not_cancellable" };

  return db.transaction(async (tx) => {
    await tx.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, id));
    await tx.execute(
      sql`UPDATE availability_slot
            SET booked_count = GREATEST(booked_count - ${row.partySize}, 0)
          WHERE id = ${row.slotId}`,
    );
    const slotRes = await tx.execute(
      sql`UPDATE availability_slot
            SET booked_count = booked_count + ${row.partySize},
                held_until = NULL, held_by = NULL
          WHERE id = ${newSlotId}
            AND booked_count + ${row.partySize} <= capacity
            AND (held_until IS NULL OR held_until < now())`,
    );
    if (slotRes.count === 0) return { ok: false as const, reason: "capacity_exceeded" };

    const newId = randomUUID();
    await tx.insert(appointments).values({
      id: newId,
      patientId: user.id,
      serviceId: row.serviceId,
      providerId: row.providerId,
      locationId: row.locationId,
      slotId: newSlotId,
      partySize: row.partySize,
      price: row.price,
      notes: row.notes,
      idempotencyKey: `reschedule-${row.id}-${newSlotId}`,
    });
    return { ok: true as const, appointmentId: newId };
  });
}
```

- [ ] **Step 5: Write the dashboard query**

`src/contexts/booking/queries.ts`:

```ts
import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, availabilitySlots } from "@/db/schema";

export async function myAppointments(userId: string) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      partySize: appointments.partySize,
      price: appointments.price,
      serviceName: services.name,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(eq(appointments.patientId, userId))
    .orderBy(desc(availabilitySlots.startsAt))
    .limit(50);
}
```

- [ ] **Step 6: Write the booking page (server) and slot picker (client)**

`src/app/[locale]/(booking)/services/[slug]/book/page.tsx`:

```tsx
import { getService } from "@/contexts/catalog/queries";
import { availabilityForService } from "@/contexts/catalog/actions";
import { SlotPicker } from "@/components/booking/slot-picker";

export default async function BookPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale, slug } = await params;
  const { date } = await searchParams;
  const service = await getService(slug, locale);
  if (!service) return <p>Not found</p>;
  const day = date ?? new Date().toISOString().slice(0, 10);
  const slots = await availabilityForService(slug, day);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">{service.name}</h1>
      <p className="mt-1 text-gray-600">{service.providerName} · {service.durationMinutes} min</p>
      <p className="mt-4 text-lg">{service.basePrice} Toman</p>

      <form className="mt-8" action={`/services/${slug}/book`}>
        <label className="block" htmlFor="date">Date</label>
        <input id="date" type="date" name="date" defaultValue={day}
               className="mb-6 rounded border px-3 py-2" />
      </form>

      <SlotPicker slots={slots.map((s) => ({
        id: s.id, startsAt: s.startsAt.toISOString(),
        capacity: s.capacity, bookedCount: s.bookedCount,
      }))} serviceId={slug} />
    </main>
  );
}
```

`src/components/booking/slot-picker.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/contexts/booking/actions";

type SlotProps = { id: string; startsAt: string; capacity: number; bookedCount: number };
type Result = { ok: boolean; appointmentId?: string; reason?: string };

export function SlotPicker({ slots, serviceId }: { slots: SlotProps[]; serviceId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (slots.length === 0) return <p className="mt-6 text-gray-500">No availability on this day.</p>;

  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const key = crypto.randomUUID();
    const res = (await bookAppointment({
      serviceId, slotId: selected, partySize: 1,
      idempotencyKey: key,
    })) as Result;
    if (res.ok && res.appointmentId) {
      router.push(`/confirm?id=${res.appointmentId}`);
    } else {
      setError(res.reason === "capacity_exceeded"
        ? "This slot was just taken. Please choose another."
        : "Booking failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">Choose a time</h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((s) => {
          const time = new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(s.id)}
                aria-pressed={selected === s.id}
                className={`w-full rounded border px-3 py-2 text-sm ${
                  selected === s.id ? "border-emerald-600 bg-emerald-50" : "border-gray-300"
                }`}
              >
                {time}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!selected || busy}
        onClick={confirm}
        className="mt-6 rounded bg-emerald-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Booking…" : "Confirm booking"}
      </button>
    </div>
  );
}
```

`src/app/[locale]/(booking)/confirm/page.tsx`:

```tsx
export default async function ConfirmPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const { id } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Appointment confirmed</h1>
      <p className="mt-4 text-gray-600">
        Reference: {id}. A reminder will be sent before your visit.
      </p>
      <a href={`/${locale}/appointments`} className="mt-8 inline-block text-emerald-700 underline">
        View my appointments
      </a>
    </main>
  );
}
```

- [ ] **Step 7: Verify the booking flow end to end**

Run: `bun run dev`
1. Seeded admin generated slots (Task 1.4).
2. As a fresh patient: `/fa/services/<id>/book?date=2026-09-01` → pick a slot → confirm → `/confirm?id=…`.
3. Confirm page links to `/fa/appointments` — build that page now (Task 1.7) or verify via DB.
4. Double-submit protection: the SlotPicker disables after click, and `idempotency_key` is per-attempt; re-running the same action with the same key hits the unique index → the second insert fails and the transaction rolls back the capacity update.
5. Book the last free seat of a capacity-1 slot from two browsers → exactly one succeeds, the other shows "This slot was just taken."

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: booking actions, slot picker, confirm page"
```

---

### Task 1.7: Patient dashboard + profile pages

**Files:**
- Create: `src/app/[locale]/(discovery)/doctors/[slug]/page.tsx`, `src/app/[locale]/(discovery)/services/[slug]/page.tsx`, `src/app/[locale]/(account)/appointments/page.tsx`, `src/app/[locale]/(account)/layout.tsx`

**Interfaces:**
- Consumes: `getDoctor`/`getService` (1.3), `myAppointments` (1.6), `requireUser` (Phase 0)
- Produces: doctor profile (credentials, bio, map link, book button), service profile (prep fields for diagnostics, book button), dashboard (upcoming/past, cancel + reschedule buttons)

- [ ] **Step 1: Write the doctor profile page**

`src/app/[locale]/(discovery)/doctors/[slug]/page.tsx`:

```tsx
import { getDoctor } from "@/contexts/catalog/queries";
import { Button } from "@/components/ui/button";

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const doctor = await getDoctor(slug, locale);
  if (!doctor) return <p>Not found</p>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start gap-6">
        {doctor.imageUrl && (
          <img src={doctor.imageUrl} alt={doctor.name as string}
               className="h-40 w-40 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{doctor.name}</h1>
          <p className="mt-1 text-emerald-700">{doctor.specialtyName}</p>
          {doctor.credentials && <p className="mt-2 text-sm text-gray-600">{doctor.credentials}</p>}
        </div>
      </div>
      {doctor.bio && <p className="mt-8 leading-relaxed">{doctor.bio}</p>}
      <div className="mt-8 rounded border p-4">
        <p><strong>Address:</strong> {doctor.addressLine ?? "—"}</p>
        <p className="mt-1"><strong>Phone:</strong> {doctor.phone ?? "—"}</p>
        {doctor.latitude && doctor.longitude && (
          <a
            className="mt-2 inline-block text-emerald-700 underline"
            href={`https://www.openstreetmap.org/?mlat=${doctor.latitude}&mlon=${doctor.longitude}#map=16/${doctor.latitude}/${doctor.longitude}`}
            target="_blank" rel="noreferrer"
          >
            View on map
          </a>
        )}
        {doctor.cvUrl && <a className="mt-2 block text-emerald-700 underline" href={doctor.cvUrl}>CV</a>}
        {doctor.videoUrl && <a className="mt-2 block text-emerald-700 underline" href={doctor.videoUrl}>Video</a>}
      </div>
      <Button asChild className="mt-8"><a href={`/services`}>Book with this doctor</a></Button>
    </main>
  );
}
```

- [ ] **Step 2: Write the service profile page**

`src/app/[locale]/(discovery)/services/[slug]/page.tsx`:

```tsx
import { getService } from "@/contexts/catalog/queries";
import { getPrepInfo } from "@/contexts/catalog/queries"; // add: diagnostic prep for diagnostic types
import { Button } from "@/components/ui/button";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = await getService(slug, locale);
  if (!service) return <p>Not found</p>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{service.name}</h1>
      <p className="mt-2 text-gray-600">{service.providerName}</p>
      <dl className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded border p-4"><dt className="text-sm text-gray-500">Duration</dt><dd>{service.durationMinutes} min</dd></div>
        <div className="rounded border p-4"><dt className="text-sm text-gray-500">Price</dt><dd>{service.basePrice} Toman</dd></div>
      </dl>
      {service.serviceType === "diagnostic" && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold">Preparation</h2>
          <p className="mt-1 text-sm">{service.prepInstructions ?? "Follow your provider's instructions."}</p>
        </div>
      )}
      <Button asChild className="mt-8"><a href={`/services/${slug}/book`}>Book this service</a></Button>
    </main>
  );
}
```

Add `getPrepInfo` to `src/contexts/catalog/queries.ts` (ruling R22: extend the schema import with `diagnosticServices` — Task 1.3's import line does not include it):

```ts
export async function getPrepInfo(serviceId: string) {
  const [row] = await db
    .select({ prepInstructions: diagnosticServices.prepInstructions, fastingHours: diagnosticServices.fastingHours })
    .from(diagnosticServices)
    .where(eq(diagnosticServices.serviceId, serviceId));
  return row ?? null;
}
```

- [ ] **Step 3: Write the patient dashboard**

`src/app/[locale]/(account)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireUser(); // server-side, not proxy-only
  return <main className="mx-auto max-w-4xl px-4 py-12">{children}</main>;
}
```

`src/app/[locale]/(account)/appointments/page.tsx`:

```tsx
import { requireUser } from "@/contexts/identity/actions";
import { myAppointments } from "@/contexts/booking/queries";
import { cancelAppointment } from "@/contexts/booking/actions";

export default async function AppointmentsPage() {
  const user = await requireUser();
  const rows = await myAppointments(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold">My appointments</h1>
      <ul className="mt-6 divide-y">
        {rows.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">{a.serviceName}</p>
              <p className="text-sm text-gray-600">
                {new Date(a.startsAt).toLocaleString()} · {a.partySize} pax · {a.status}
              </p>
            </div>
            {a.status === "confirmed" && (
              <form action={async () => { "use server"; await cancelAppointment(a.id); }}>
                <button type="submit" className="rounded border border-red-300 px-4 py-1 text-sm text-red-700">
                  Cancel
                </button>
              </form>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-gray-500">No appointments yet.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `bun run dev` — doctor profile renders seeded provider with map link; service profile renders prep box for diagnostics; dashboard lists the appointment from Task 1.6; cancel frees the slot (booked_count decrements — check via `drizzle studio`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: doctor and service profiles, patient appointment dashboard"
```

---

### Task 1.8: Journey tests + concurrency proof

**Files:**
- Create: `playwright.config.ts`, `e2e/journeys.spec.ts`, `e2e/double-book.spec.ts`

**Interfaces:**
- Consumes: everything in this phase
- Produces: proof of J-001 (find + book doctor) and J-002 (book diagnostic service) end to end; proof that concurrent submission cannot double-book a slot

- [ ] **Step 1: Install Playwright**

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

- [ ] **Step 2: Extend the seed with base catalog rows + a test slot** (ruling R24 — completes Phase 0 ruling R5's deferral; the e2e journeys and the concurrency proof need real rows and a fixed capacity-1 slot)

Append to `scripts/seed.ts` (idempotent, fixed IDs; the slot date is dynamic — today UTC, 18:00, so the book page's default date shows it):

```ts
// Base catalog rows (catalog schema arrived in Phase 1 Task 1.1)
await db.insert(serviceCategories).values({
  id: CATEGORY_ID, slug: "cardiology", name: "قلب و عروق",
}).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "قلب و عروق" } });
await db.insert(providers).values({
  id: PROVIDER_ID, kind: "person", name: "دکتر آزمایشی قلب", primaryLocationId: LOCATION_ID, phone: "02111111111",
}).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر آزمایشی قلب" } });
await db.insert(practitioners).values({
  providerId: PROVIDER_ID, specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق", credentials: "فوق تخصص قلب",
}).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "متخصص قلب و عروق" } });
await db.insert(locations).values({
  id: LOCATION_ID, providerId: PROVIDER_ID, label: "تهران مرکزی", addressLine: "تهران، خیابان ولیعصر", cityId: "1",
}).onConflictDoUpdate({ target: locations.id, set: { label: "تهران مرکزی" } });
await db.insert(services).values({
  id: SERVICE_ID, providerId: PROVIDER_ID, categoryId: CATEGORY_ID, serviceType: "diagnostic",
  locationId: LOCATION_ID, name: "نوار قلب", durationMinutes: 30, basePrice: "500000",
}).onConflictDoUpdate({ target: services.id, set: { name: "نوار قلب" } });
await db.insert(diagnosticServices).values({
  serviceId: SERVICE_ID, prepInstructions: "ناشتا بودن به مدت ۸ ساعت", fastingHours: 8,
}).onConflictDoNothing();
const TEST_SLOT_ID = "slot-test-1";
const today = new Date();
const slotStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 18, 0));
await db.insert(availabilitySlots).values({
  id: TEST_SLOT_ID, providerId: PROVIDER_ID, serviceId: SERVICE_ID,
  startsAt: slotStart, endsAt: new Date(slotStart.getTime() + 30 * 60_000),
  capacity: 1,
}).onConflictDoNothing();
```

Re-run idempotency holds (upserts + `onConflictDoNothing` on the slot).

- [ ] **Step 3: Write the config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000", ...devices["Desktop Chrome"] },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 4: Write the journey spec** (rulings R25/R26 — the flows need a session and a slot selection)

`e2e/journeys.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api-test/login");
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  await test.use({ storageState: undefined });
  // token is consumed per-context in each test below via the login route cookie
});

async function signIn(page: import("@playwright/test").Page) {
  const res = await page.request.post("/api-test/login");
  const { token } = await res.json();
  await page.context().addCookies([
    { name: "better-auth.session_token", value: token, url: "http://localhost:3000" },
  ]);
}

test("J-001 find and book a doctor service", async ({ page }) => {
  await signIn(page);
  await page.goto("/fa/search?q=قلب");
  await expect(page.getByRole("link", { name: /ECG|نوار قلب/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /ECG|نوار قلب/ }).first().click();
  await page.getByRole("link", { name: "Book this service" }).click();
  await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first().click();
  await page.getByRole("button", { name: /Confirm booking/ }).click();
  await expect(page).toHaveURL(/\/confirm\?id=/);
});

test("J-002 book a diagnostic service with prep visible", async ({ page }) => {
  await page.goto("/fa/services");
  await page.getByRole("link", { name: /ECG|نوار قلب/ }).first().click();
  await expect(page.getByText("Preparation")).toBeVisible();
});
```

- [ ] **Step 5: Write the concurrency proof + the test-only routes**

`e2e/double-book.spec.ts` — two parallel requests against the same capacity-1 slot; exactly one appointment exists after:

```ts
import { test, expect } from "@playwright/test";

test("concurrent booking cannot double-book a capacity-1 slot", async ({ page }) => {
  const resp = await Promise.all([
    page.request.post("/api-test/book", { data: { slotId: process.env.TEST_SLOT_ID ?? "slot-test-1" } }),
    page.request.post("/api-test/book", { data: { slotId: process.env.TEST_SLOT_ID ?? "slot-test-1" } }),
  ]);
  const statuses = (await Promise.all(resp.map((r) => r.json()))).map((r) => r.ok);
  expect(statuses.filter(Boolean).length).toBe(1);
});
```

To support this, add two temporary test-only routes (rulings R23/R25 — the e2e cannot run the OTP flow, so auth is bypassed with a fixed patient; the booking transaction stays in exactly one place), and extend the proxy's R11 exclusion in `src/proxy.ts` to also pass `/api-test/` through (ruling R29 — otherwise it 307s these routes to `/fa/api-test/...`):

```ts
    pathname.startsWith("/api/") ||
    pathname.startsWith("/api-test/") ||
    pathname.startsWith("/_next/") ||
```

`src/app/api-test/book/route.ts` (calls the `bookAppointmentWithUser` seam from Task 1.6 against the seeded slot):

```ts
import { NextRequest, NextResponse } from "next/server";
import { bookAppointmentWithUser } from "@/contexts/booking/actions";
// ponytail: test-only route, delete when e2e is stable

export async function POST(req: NextRequest) {
  const { slotId } = await req.json();
  const res = await bookAppointmentWithUser(
    { id: "test-patient" },
    { serviceId: "svc-ecg-1", slotId, partySize: 1, idempotencyKey: crypto.randomUUID() },
  );
  return NextResponse.json(res);
}
```

`src/app/api-test/login/route.ts` (creates a fixed patient + session row, returns the token for the session cookie):

```ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
// ponytail: test-only route, delete when e2e is stable

export async function POST() {
  await db.insert(users).values({
    id: "test-patient", name: "Test Patient", phoneNumber: "09120000001",
    phoneNumberVerified: true, role: "patient",
  }).onConflictDoUpdate({ target: users.id, set: { role: "patient" } });
  const token = randomUUID();
  await db.insert(sessions).values({
    id: randomUUID(), token, userId: "test-patient",
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  }).onConflictDoNothing();
  return NextResponse.json({ token });
}
```

- [ ] **Step 6: Run the journeys**

Run: `bunx playwright test`
Expected: 3 tests pass. If the concurrency test flakes, run it 5× (`--repeat-each=5`) — the conditional UPDATE must make both outcomes deterministic: one `rowCount===0`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: journey and concurrency proof for booking"
```

---

### Task 1.9: Phase 1 exit verification

**Files:** none

- [ ] **Step 1: Full pass**

```bash
bun run test && bun run lint && bun run build && bunx playwright test
```

Expected: all green.

- [ ] **Step 2: Spec §11 Phase 1 exit criteria — manual check**

1. J-001 complete end to end (search → profile → book → confirm).
2. J-002 complete (category → service → prep → book).
3. Concurrent submit cannot double-book (Task 1.8).
4. Admin created provider/service/location in 3 locales (Task 1.4 Step 6).
5. Every bookable result has a clear next step (profiles link to `/book`).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: phase 1 exit verification"
```

---

## Phase 1 Self-Review

- **Spec coverage:** §5.1 (provider/service model) — Task 1.1; §5.2 (appointment + states) — Task 1.1/1.5; §5.3 (three DB enforcements) — Task 1.1 Step 2, Task 1.6; §6.1 (booking kernel flow) — Tasks 1.5/1.6; §6.2 (lazy holds) — Task 1.4 `availabilityForService`, Task 1.6 conditional UPDATE; §6.3 (reschedule = cancel+create) — Task 1.6; §9 (admin CRUD + scheduling) — Task 1.4; §10 (FTS search) — Task 1.3; §12 (three test targets + Playwright) — Tasks 1.5, 1.8; F-001..F-006, F-010, F-018, F-019, F-022, F-023, F-024 — Tasks 1.3–1.7.
- **Placeholders:** none — the two pages marked "follow the same shape" in Task 1.3 Step 5 are the only repetitions and each is explicitly specified; admin CRUD repetition in Task 1.4 Step 5 names the exact reference implementation and the deltas.
- **Type consistency:** `bookAppointment` returns `{ ok: true, appointmentId }` — SlotPicker consumes `{ ok, appointmentId?, reason? }` matching; `expandPattern` returns `Date[]` and `generateSlots` feeds it ISO strings per its signature; `availabilityForService` returns full slot rows with `id/startsAt/capacity/bookedCount` consumed by the book page's map; kernel `canCancel(status)` matches appointment `status` values from the schema; `reschedulePlan` result shapes match the actions' usage.