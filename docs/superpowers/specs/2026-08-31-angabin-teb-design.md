# Angabin Teb — Platform Design Specification

> **Status:** Design approved 2026-08-31. Supersedes nothing; complements `angabin-teb-product-spec.md` (the reverse-engineered feature baseline).
> **Source of truth:** `angabin-teb-product-spec.md` for *what* the product does. This document for *how* it is built.
> **Scope:** Full platform, phased. Deliverable at this stage is design + implementation plan, not code.
> **Team assumption:** Solo developer, greenfield, all data seeded.

---

## 1. Locked decisions

| Decision | Choice |
|---|---|
| Build goal | Spec + implementation plan only, no code yet |
| Scope | Full platform, spec'd per phase |
| Stack | Next.js + TypeScript + PostgreSQL |
| Team / data | Solo dev, greenfield, seeded data |
| Architecture | Shared booking kernel + one `Service` entity, per-type satellite tables |
| Translation | Full multilingual data layer + localized UI catalogs |
| Admin | First-class operator console, not a seed tool |

---

## 2. Technology stack

Versions verified against public sources on **2026-08-31**. npm moves — re-verify with `npm ls` at install time and pin exact patches.

### 2.1 Core

| Layer | Choice | Version | Why |
|---|---|---|---|
| Runtime | Node.js | 24 LTS | Active LTS. Next.js 16 requires ≥ 20.9 |
| Framework | Next.js | 16.3.x | App Router, RSC, Server Actions. Turbopack is default for `next dev` and `next build` |
| UI runtime | React | 19.2.x | Ships with the Next 16 App Router |
| Language | TypeScript | 7.0.2 | Native Go compiler, ~8–12× faster typecheck. See 2.4 for the caveat |
| Database | PostgreSQL | 17 | Constraints and partial indexes carry the correctness load (see §5.3) |
| ORM | Drizzle ORM | 0.45.x + `drizzle-kit` | SQL-shaped, no codegen step, readable migrations. 1.0 is still RC — do not start a project on it |
| Driver | `postgres` (postgres.js) | 3.4.x | Drizzle's recommended Postgres driver |

### 2.2 Application

| Concern | Choice | Note |
|---|---|---|
| Auth | Better Auth + `phoneNumber` plugin | Phone-first OTP per F-018's own modernization direction. **Auth.js is now part of Better Auth** — do not start on `next-auth` |
| Styling | Tailwind CSS v4.3.x | CSS-first config via `@theme`. No `tailwind.config.js`. Installed through `@tailwindcss/postcss` for Next |
| RTL | Logical CSS properties | `ms-/me-`, `ps-/pe-`, `text-start/end`. v4 has logical properties built in |
| i18n | next-intl v4 | `[locale]` dynamic segment, type-safe message keys, RSC-native. See §8 |
| UI primitives | shadcn/ui (Radix, vendored) | ~10 primitives (dialog, select, popover, tabs, toast). Code lands in your repo, not a dependency you're locked into |
| Validation | Zod | Shared between Server Actions and Drizzle (`drizzle-zod`) |
| Lint | Oxlint | See 2.4 — avoids the TypeScript compiler-API problem entirely |
| Format | Prettier | One config, no debate |
| Maps | Leaflet + OpenStreetMap | Matches F-024's observed stack. No Mapbox — key management and cost buy nothing here |
| Package manager | pnpm | Fast, strict, disk-efficient |

### 2.3 Testing

| Concern | Choice |
|---|---|
| Unit / domain | Vitest |
| End-to-end | Playwright |
| Local Postgres | Docker Compose (`postgres:17`) |

### 2.4 Three version-specific hazards

**1. TypeScript 7 has no JavaScript compiler API.** The `typescript` package no longer ships `lib/typescript.js`. Any tool that imports `typescript` programmatically breaks: `typescript-eslint`, `ts-morph`, `tsup --dts`, `ts-jest`. A stable API arrives in 7.1.

Next.js 16.3 itself works with TS 7.0.2 — verified by multiple production upgrade reports. The project's own `tsc --noEmit` and `next build` typecheck pass. The breakage is in *tooling*, not the framework.

Mitigation chosen: **Oxlint instead of ESLint + typescript-eslint.** Oxlint does not touch the TS compiler API, so the problem disappears rather than being worked around. If type-aware linting is ever required, install the compat alias and accept two compilers:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

**2. Next.js 16 renamed `middleware.ts` → `proxy.ts`.** The file must export a function named `proxy` (or a default). Auth libraries' documentation predates this and shows the old pattern, which throws on 16. This affects both auth route protection and next-intl's locale negotiation.

**3. Proxy-only authorization is bypassable.** CVE-2025-29927 demonstrated that middleware/proxy session checks can be defeated by spoofing the `x-middleware-subrequest` header. Consequence for this design: **`proxy.ts` handles locale negotiation and cheap optimistic redirects only. Every protected page and every Server Action re-verifies the session server-side.** Authorization lives in the data layer, not the edge.

### 2.5 Other Next.js 16 behaviours this design depends on

- `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` are **async only** — the sync shim was removed in 16.
- Turbopack is default; a custom `webpack` config now fails `next build` unless you pass `--webpack`. This project has no webpack config.
- `next lint` was removed from core in 16.1 — linting runs through the linter's own CLI.
- Parallel route slots require an explicit `default.js`.
- Browser floor: Chrome/Edge 111+, Firefox 111+, Safari 16.4+ (matches Tailwind v4's floor).
- `next/root-params` exposes root dynamic params without threading them — used for locale lookup.

---

## 3. Scale guardrails

Deliberately absent, with the trigger that would justify adding each. This is the anti-over-engineering contract.

| Not included | Do this instead | Add it when |
|---|---|---|
| Redis | Postgres, plus Next's request cache | A measured query is the bottleneck, not before |
| Job queue / cron | Lazy expiry checks in queries (see §6.2) | Something genuinely must run unattended on a schedule |
| External search (Typesense/Meilisearch) | Postgres full-text search | FTS measurably fails on relevance or latency with real data volumes |
| Separate API service | Server Actions + Route Handlers | A non-web client needs the API |
| Microservices / multiple deploys | One app, six context folders | Team size makes deploy coordination the bottleneck |
| Event bus / CQRS / DDD ceremony | Direct calls through each context's public interface | Two contexts need independent scaling — unlikely at this scale |
| GraphQL | Nothing | A client demands it |
| Client state library | `useState` / `useReducer`, server state via RSC | A genuinely complex client-side state machine appears |
| TanStack Table | Server-side pagination, filtering, sorting in SQL | Admin users demand client-side multi-column sort/filter |
| React Hook Form | `useActionState` + Zod on Server Actions | Admin forms become painful to write by hand |
| Email infrastructure | Phone OTP only | Password recovery by email is required |
| Kubernetes | Docker Compose for local Postgres; single deploy target | Traffic demands it |

---

## 4. Architecture

### 4.1 Bounded contexts

One Next.js app, one Postgres database, six contexts. A context here is a folder with its own schema slice, domain logic, and a narrow public interface — not a separate service.

| Context | Owns |
|---|---|
| **Identity** | `user`, phone/OTP verification, sessions, roles |
| **Catalog** | `provider`, `practitioner`, `location`, `service`, `service_category`, `availability_slot` |
| **Booking** | `appointment`, the booking kernel, state transitions |
| **Nutrition** | `physiology_profile`, `food`, `serving_unit`, `nutrient`, `food_intake`, `daily_nutrition`, `diet_program` |
| **Content** | `content`, `topic`, `condition` |
| **Support** | `support_request` |
| **Platform** (cross-cutting) | `translation`, i18n catalogs, notifications, search |

**Hard rule:** contexts communicate through their public interface only. Booking asks Catalog whether a slot is real; it does not join `availability_slot` itself. This is the single piece of discipline that keeps 26 features from becoming one tangle, and it costs nothing at this size.

### 4.2 Folder layout

```
src/
  app/
    [locale]/
      (marketing)/      # home, about, contact, trust
      (discovery)/      # search, doctors, services, profiles
      (booking)/        # booking flow
      (account)/        # patient dashboard
      (nutrition)/      # nutrition workspace
      (content)/        # articles, guides, FAQ, videos, topic hubs
      admin/            # operator console
    api/                # route handlers: webhooks only
  proxy.ts              # locale negotiation + optimistic redirects (NOT authz)
  contexts/
    identity/  catalog/  booking/  nutrition/  content/  support/
  db/
    schema/             # one file per context, barrel-exported
    migrations/
  lib/                  # sms, money, datetime, i18n
  components/ui/        # shadcn primitives
messages/
  fa.json  en.json  ar.json
```

### 4.3 Context file shape

Each context folder has the same four files:

```
contexts/booking/
  kernel.ts     # pure domain logic, no DB — unit tested
  queries.ts    # read path, server-only
  actions.ts    # write path, 'use server'
  model.ts      # types shared with the UI
```

`kernel.ts` is where the real logic lives and the only thing with dedicated unit tests. Keeping it DB-free is what makes it testable without fixtures.

---

## 5. Data model

### 5.1 Provider and service

One `provider` table with a `kind` discriminator; one satellite for person-only fields. Organizations (clinic / office / service org) need nothing extra.

```sql
provider(id, kind,            -- person | organization
         org_type,            -- clinic | office | service_org, null when person
         name,                -- Persian source of truth; see §5.6
         primary_location_id, phone, image_url, created_at)
practitioner(provider_id PK, specialty_id, bio, credentials, cv_url, video_url)

service_category(id, slug, name, parent_id, sort_order)

location(id, provider_id, label, address_line, city_id,
         latitude, longitude, phone, is_active)
```

`location` is shared by practitioners, clinics, and home-care serviceability, which is what makes it worth its own table rather than columns on `provider` (F-024).

One `service` table with a `service_type` discriminator; satellites only where a family genuinely needs fields.

```sql
service(id, provider_id, category_id, service_type, location_id,
        name,                 -- Persian source of truth; see §5.6
        duration_minutes, base_price, is_bookable, is_active)
        -- service_type: diagnostic | therapy | home_care | rehab | ambulance | consultation

diagnostic_service(service_id PK, prep_instructions, fasting_hours, requires_referral)
home_care_service(service_id PK, requires_patient_address, serviceable_city_ids[])
ambulance_service(service_id PK, dispatch_model, vehicle_type)   -- Phase 4
```

Adding a service family is one small table, not a new subsystem. That is the entire payoff of the chosen architecture.

### 5.2 Availability and appointment

```sql
availability_slot(id, provider_id, service_id, starts_at, ends_at,
                  capacity, booked_count, held_until, held_by)

appointment(id, patient_id, service_id, provider_id, location_id, slot_id,
            party_size,          -- F-010's 2/3/4 patient-count choice
            status,              -- confirmed | cancelled | completed | no_show
            payment_status,      -- unpaid | paid_at_location | refunded
            price, notes, idempotency_key, created_at)
```

No `pending` state in Phase 1 — with pay-at-location, a booking goes straight to `confirmed`. `pending` returns in Phase 4 with online payment.

### 5.3 Correctness enforced by the database

Three constraints replace what would otherwise be application-level locking, retries, and careful sequencing.

```sql
-- No double-booking
CREATE UNIQUE INDEX one_booking_per_slot
  ON appointment(slot_id) WHERE status NOT IN ('cancelled','no_show');

-- Idempotency (NFR-006)
CREATE UNIQUE INDEX appointment_idempotency ON appointment(idempotency_key);

-- Slot capacity, enforced atomically without explicit locks
UPDATE availability_slot
   SET booked_count = booked_count + $party_size
 WHERE id = $slot_id
   AND booked_count + $party_size <= capacity;
-- rowCount === 0 → slot no longer available, surface to the user
```

The conditional `UPDATE` is the important one: it is atomic, needs no `SELECT … FOR UPDATE`, and cannot oversell a slot under concurrency.

### 5.4 Nutrition

```sql
physiology_profile(user_id PK, sex, birth_date, height_cm, weight_kg, activity_level)
food(id, name, category, meal_types[], image_url, source, source_version)
serving_unit(id, food_id, name, grams_equivalent)         -- plate / ladle / spoon
nutrient(id, slug, name, unit)
food_nutrient(food_id, nutrient_id, amount_per_100g)     -- rows, not columns
nutrient_requirement(nutrient_id, sex, age_min, age_max, amount, source)
food_intake(id, user_id, food_id, serving_unit_id, quantity, logged_at)
daily_nutrition(user_id, date, energy_kcal, carbs_g, protein_g, fat_g)  -- rollup
diet_program(id, name, organization_context, plan_type, duration_days, price, practitioner_id)
```

Two design points worth stating:

- **`serving_unit.grams_equivalent` is the whole F-012 domain trick.** "One ladle of ash" resolves to grams, after which all arithmetic is per-100g. Keeping nutrients as rows means adding a micronutrient is a data insert, not a migration.
- **`NutritionAnalysis` is not a table.** It is computed against `daily_nutrition`, which is a rollup recomputed on intake write so history and charts don't rescan every entry.

### 5.5 Content, support, translation

```sql
content(id, kind, slug, title, status, published_at)  -- article | pamphlet | faq | video
topic(id, slug, name)   condition(id, slug, name)
content_topic(content_id, topic_id)

support_request(id, user_id, kind, subject, body, status,
                appointment_id?, service_id?, provider_id?)
                -- kind: question | complaint | appointment_issue

translation(entity_type, entity_id, locale, field, value,
            PRIMARY KEY (entity_type, entity_id, locale, field))
```

- F-025's unified `media` entity is **deleted**. A doctor's video is `practitioner.video_url`; an educational video is `content.kind = 'video'`. Two columns instead of a table.
- F-017's topic hub is **a query**, not an entity: content filtered by topic, plus related services and practitioners.
- F-020 and F-021 collapse into one `support_request` table with a `kind` discriminator.
- `translation` is polymorphic and therefore has no foreign key. **Ceiling: no referential integrity.** Split into per-entity translation tables only if orphaned rows actually appear in practice.

### 5.6 How translation actually attaches

Every translatable entity keeps a **base column in Persian** (`name`, `title`, `bio`), and `translation` rows hold **overrides for non-base locales only**. Reads overlay the requested locale onto the base.

This split is not redundant. Putting all names in `translation` would break three things at once:

- **Full-text search** (§10) indexes the base column. A polymorphic table with no FKs cannot be indexed usefully for FTS.
- **Integrity** — uniqueness and `NOT NULL` on names.
- **Admin defaults** — operator lists render the base column with no join, which matters on every admin table.

So: `service.name` is Persian and always present; `service.name` in English is a `translation` row with `entity_type='service'`, `field='name'`, `locale='en'`.

---

## 6. Core flows

### 6.1 Booking kernel

The single flow every bookable type runs:

```
resolve bookable
  → availability (date-scoped slots)
  → HOLD slot (10-minute TTL)
  → identify patient (phone OTP)
  → review (price, location, preparation notes)
  → confirm → appointment created → notification
```

Service types branch in exactly **two** places:
1. What the review step renders — preparation instructions vs. home address capture.
2. What confirmation triggers — a dispatch record for ambulance only, starting Phase 4.

### 6.2 Slot holds without a job runner

Holds are columns on `availability_slot` (`held_until`, `held_by`). Expiry is evaluated **lazily** — every availability query filters `held_until IS NULL OR held_until < now()`. Expired holds are never read as held. No background sweeper, no cron, no queue. The only cost is that expired rows linger until a vacuum, which is exactly the right trade for a solo-built system.

### 6.3 Rescheduling

Reschedule is **cancel + create**, never a mutation of the existing row. History is preserved, and the partial unique index in §5.3 keeps working because the cancelled row drops out of the index predicate.

---

## 7. Nutrition engine

Analysis pipeline, in order:

1. Intake → grams: `quantity × serving_unit.grams_equivalent`
2. Grams → nutrients: `food_nutrient.amount_per_100g × grams / 100`
3. Sum per day, write `daily_nutrition` rollup
4. Requirements: `nutrient_requirement` matched on sex and age band
5. Compare actual vs required, surface deficits

Energy requirement: **Mifflin-St Jeor** for BMR, multiplied by an activity factor for TDEE.

Both the formula and the reference intake standards are **UNVERIFIED** in the source spec (§11, "Nutrition engine"). They are named explicitly here so the implementation does not quietly invent them. See §11, risk 1.

---

## 8. Internationalization and RTL

Two separate layers.

**Interface.** next-intl v4 with a root `[locale]` segment (`fa` default, plus `en`, `ar`). Message catalogs in `messages/{fa,en,ar}.json`, type-safe keys. Direction from locale: `fa`/`ar` → `dir="rtl"`, `en` → `dir="ltr"`. All layout uses logical CSS properties so structure survives direction change (NFR-001).

**Data.** The polymorphic `translation` table (§5.5) holding **non-Persian overrides only**, per the base-column pattern in §5.6. One helper loads all rows for an entity and overlays the requested locale onto the Persian base column.

**Integration risk:** next-intl's locale negotiation historically lived in `middleware.ts`, which Next 16 renamed to `proxy.ts`. Verify next-intl v4's Next 16 compatibility at implementation time; if the middleware integration lags, locale negotiation moves into `proxy.ts` directly — roughly 30 lines with `@formatjs/intl-localematcher` + `negotiator`, or a cookie-based locale with no negotiation at all.

---

## 9. Admin console

Route group `src/app/[locale]/admin`, one `requireAdmin()` guard at the layout, Server Actions per resource, ~5 shared primitives (`DataTable`, `ResourceForm`, `FilterBar`, `StatusBadge`, `BulkActions`). Not a component library.

| Area | Capability |
|---|---|
| **Overview** | Today's appointments, pending bookings, open complaints, new users, slot utilisation |
| **Catalog** | Providers (person + org, credentials), Services incl. type-specific fields, Categories, Locations |
| **Scheduling** | Recurring weekly pattern per provider/service → concrete slots. The one genuinely non-trivial admin feature |
| **Bookings** | Filter by status / date / provider / service; view, cancel, reschedule, mark no-show, mark refund |
| **Nutrition** | Foods + serving units + per-100g nutrient grid; nutrients; requirement tables; diet programs |
| **Content** | Content CRUD by kind, topics, conditions, translations |
| **Users** | List, view, verify, disable, change role |
| **Support** | Queue with status, priority, assignment, linked appointment/provider |
| **Settings** | Locales, SMS/maps/payment credentials, booking rules (lead time, hold TTL), feature flags |

Roles: a single `role` column (`patient | provider | admin`) plus a `requireRole()` helper. Phase 1 ships admin-only; the provider portal and its permission model land in Phase 4.

---

## 10. Cross-cutting services

| Service | Approach |
|---|---|
| **Search** | One Postgres FTS query over the Persian base columns — `service.name`, `provider.name`, `practitioner.bio`, `content.title` — unioned and ranked by entity type. No external engine (§3) |
| **SMS / OTP** | One `sendSms(to, body)` function. Dev writes to the server log; prod swaps in Kavenegar or Melipayamak. No abstraction beyond that one function |
| **Notifications** | Rows in the database, surfaced in the dashboard. Outbound channels hang off the same SMS function |
| **Payments** | Absent until Phase 4. Phase 1 is `payment_status = 'unpaid'` with pay-at-location |
| **Audit** | `created_at` / `updated_at` on mutable tables. No separate audit log until compliance demands one |

---

## 11. Phasing

Estimates are for one developer, assuming the discovery spikes in §13 are resolved before their phase starts.

| Phase | Features | Exit criteria | Estimate |
|---|---|---|---|
| **0 — Foundation** | Schema + migrations, Better Auth phone OTP, next-intl + RTL, admin shell, seed pipeline | Admin signs in, creates a provider, a service, and a location in three locales | **1–2 wk** |
| **1 — Core** | F-001, 002, 003, 004, 005, 006, 010, 018, 019, 022, 023, 024 | J-001 and J-002 complete end to end; concurrent submission cannot double-book a slot | **4–6 wk** |
| **2 — Nutrition** | F-011, 012, 013, 014, 015 | J-003 and J-004 complete; intake→nutrient math matches hand-checked reference cases | **3–4 wk** |
| **3 — Knowledge** | F-016, 017, 020, 021, 025, 026 | J-005 complete; topic hub renders from a query, not a new entity | **2–3 wk** |
| **4 — Extended care** | F-007, 008, 009, provider portal, payments, advanced support | Home-care address + serviceability flow works; ambulance dispatch either defined or formally dropped | **4–6 wk** |

**Total: 14–21 weeks.** Phases 0 and 1 are load-bearing — everything after is additive.

Phase 0 exists because i18n, RTL, auth, and the admin shell are cross-cutting: retrofitting any of them into a built Phase 1 costs more than building them first.

## 12. Testing

Real logic lives in exactly three places, so that is where tests go. Everything else is CRUD, exercised by using it in the admin console.

| Target | Tests |
|---|---|
| **Booking kernel** (`kernel.ts`) | Hold expiry, concurrent double-booking, cancel/reschedule transitions, party-size vs. capacity |
| **Nutrition math** (`kernel.ts`) | Serving-unit → grams → per-100g scaling, daily rollups, requirement lookup by age/sex band |
| **Availability generation** | Weekly pattern expansion, overlap detection, holiday exclusion |

Plus Playwright over the four critical journeys (J-001…J-004) at the end of Phase 1, and one integration test per booking flow against a disposable test database.

**Not doing:** per-function unit suites, snapshot tests, 100% coverage targets, mocked-everything service tests. Domain kernels are pure functions — they need no fixtures, and that is the point of keeping them DB-free (§4.3).

## 13. Risks and open questions

Ordered by how much damage they do if ignored.

1. **Nutrient reference data is a Phase 2 blocker.** You need a real food composition table (Iran's national FCT or USDA FDC) and a named RDA authority. Both are UNVERIFIED in the source spec. This is a **discovery spike, not a coding task** — resolve it before Phase 2 starts, or Phase 2 cannot be estimated.
2. **Food database seeding is the largest data task in the project.** Plan 50–100 foods with serving units and nutrients first, then expand. Not "import everything."
3. **Provider-side availability semantics are invented, not observed.** The weekly-pattern model in §9 is a design, not a recovered requirement. Validate it against how a clinic actually schedules before building admin UI on it.
4. **next-intl + the `proxy.ts` rename** — see §8. Verify early in Phase 0; it is cheap to route around and annoying to discover in Phase 1.
5. **TypeScript 7 tooling gaps** — see §2.4. Oxlint sidesteps this. Re-evaluate when TS 7.1 ships a stable API.
6. **Health-data compliance, eNAMAD, and hosting jurisdiction** are outside my knowledge. Iranian health-data regulations and payment/SMS gateway availability under sanctions are local questions. Flag for someone with jurisdiction.
7. **Booking no-show and cancellation policy** is undefined in the source. Needs a product decision, not a technical one.

---

## 14. Explicitly out of scope

Real payment gateway (Phase 4) · Email delivery · Provider portal (Phase 4) · Live tracking · Insurance handling · Calendar integrations · Ambulance dispatch internals · Mobile native apps · Public API.

---

## 15. Change log

| Date | Change |
|---|---|
| 2026-08-31 | Initial design specification. Stack versions verified against public sources. |
| 2026-08-31 | Self-review: added §5.6 (base-column + override translation pattern) and `location` / `service_category` tables; added §11 phasing and §12 testing. |
