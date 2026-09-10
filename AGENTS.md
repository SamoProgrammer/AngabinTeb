<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Angabin Teb — Agent Brief

> **One-line:** Persian health platform — booking (doctors/clinics/services), nutrition (body→BMR/TDEE + food diary + diet), content (articles/videos/FAQ by topic), 3 locales, phone-OTP auth.
> **Read this first, then the spec. This file is the handoff; `docs/` is the depth.**

## Stack

Next 16.3.3 App Router (Turbopack) · React 19 · TS 7.0.2 (oxlint only, NO typescript-eslint) · Tailwind v4 · Drizzle 0.45 + postgres.js 3.4 · better-auth 1.7.2 · next-intl 4 · Node 26.7 · Postgres 17 (docker compose) · **bun** (never pnpm/npm/yarn) · Vazirmatn + Plus Jakarta Sans · lucide-react icons (no icon font) · Vercel AI SDK v7 (`ai` + `@ai-sdk/openai`, Gateway default; env `AI_API_KEY`/`AI_MODEL`/`AI_BASE_URL`).

## Where things live

```
src/app/[locale]/          # App Router: (discovery), (booking), (account), (auth), (nutrition), (content), (marketing), admin/
  # Nutrition IA (profile-centric): (account)/profile hub + clinical (registry) + diets/[id] (claim statuses) + calorie/[id] (periods) + body (weigh-ins); public (diet)/diet wizard (type→tier→org→payment→check), (discovery)/calculator + foods. Deleted: (nutrition) group, diary, food-analysis/*, offline-diet, foods/meal-type (proxy.ts 307s cover old URLs).
src/components/clinical/   # Domain assemblies: DoctorCard, ServiceCard, UniversalSearchBar, TrustMetrics, MetabolismCalculator, icons.ts (Material→Lucide map + resolveIcon)
src/components/layout/     # Global chrome: ClinicalHeader (mega-dropdowns, auth menu), ClinicalFooter, MobileNav, AdminShell
src/components/ui/         # shadcn (base-ui variant) vendored
src/contexts/{identity,catalog,booking,nutrition,content,support}/  # kernel.ts queries.ts actions.ts model.ts
src/lib/                   # metabolism.ts (Mifflin-St Jeor math engine), auth.ts, auth-client.ts, sms.ts, translate.ts, db.ts, ai-diet.ts (diet prompt + generateDietPlan via AI SDK), jalali.ts + format.ts (Jalali dates — ONLY date path, never native date/datetime-local inputs)
src/db/schema/             # one file per context + index.ts barrel
messages/{fa,en,ar}.json   # next-intl catalogs (fa source of truth, en/ar overrides)
scripts/seed*.ts           # seed + seed-nutrition + seed-content + seed-rehab
e2e/*.spec.ts              # Playwright (journeys, double-book, knowledge, nutrition, extended)
drizzle.config.ts          # schema → src/db/migrations/
```

## Commands

```bash
bun run dev              # Next dev (Turbopack)
bun run db:generate      # drizzle-kit generate (no DB needed)
bun run db:migrate       # drizzle-kit migrate (needs DATABASE_URL)
bun run db:seed          # tsx scripts/seed.ts (+ :nutrition :content :rehab)
bunx tsc --noEmit        # typecheck — must be 0
bun run lint             # oxlint src — must be 0 (no-await-in-loop warnings in catalog actions are accepted)
bun run test             # vitest run (unit) — e2e specs fail without dev server, pre-existing
bunx playwright test     # e2e (needs dev server + seeded DB)
```

## Conventions that bite

- **Design Tokens & Typography (Tailwind v4):** Persian Clinical Wellness palette configured in `src/app/globals.css` via `@theme inline` (`--color-primary`: #005f4c, `--color-secondary`: #904d00, `--color-tertiary`: #005f54, porcelain surfaces). Elevation tokens: `shadow-tier-1` to `shadow-tier-3`. Fonts loaded via `next/font/google` in `src/app/fonts.ts` (`--font-vazirmatn`, `--font-plus-jakarta-sans`).
- **Strict RTL & Logical Properties:** Always use logical Tailwind properties (`ps/pe`, `text-start`, `ms/me`, `border-s/border-e`, `start-0/end-0`). Physical properties (`pl/pr`, `left/right`) are strictly forbidden.
- **Iconography (lucide-react):** Direct imports only — `import { Stethoscope } from "lucide-react"`, render `<Stethoscope size={...} aria-hidden="true" />` preserving size/className. `fill={true}` becomes `fill="currentColor"`. Dynamic names use `resolveIcon(name)` from `@/components/clinical/icons` (falls back to `CircleHelp`, never text). Canonical Material→Lucide picks live in `icons.ts` — reuse, don't invent. `ClinicalIcon` and the Material Symbols webfont are deleted; no `fonts.googleapis` icon links.
- **Global Chrome & Layout Structure:** 3-tier chrome: sticky `ClinicalHeader` (4 mega-dropdown clinical hubs, locale switcher, reactive auth button/menu), bottom `MobileNav` for phones (`md:hidden`), and `ClinicalFooter` with 115 emergency banner, zero-fee guarantee, and `pb-16 md:pb-0` mobile dock clearance.
- **Nutrition Engine & Persian Measures:** Metabolic math uses Mifflin-St Jeor equation in `src/lib/metabolism.ts` (calculates BMR, TDEE, macronutrient distribution). Daily food diary integrates traditional Iranian portion units (`کف دست`, `لیوان`, `قاشق`, `بشقاب`).
- **Jalali dates only:** all date/datetime UI goes through `JalaliDatePicker` (`@/components/clinical/jalali-date-picker`, emits hidden Gregorian input) + `formatJalali*` — native `type="date"`/`datetime-local` is forbidden (use picker + `type="time"` for times).
- **Server Actions export async only:** Turbopack build fails on sync exports from `"use server"` modules — pure helpers live in `kernel.ts` (see `validatePeriodInput` precedent), actions stay async.
- **DAL reads are `cache()`d:** every `contexts/*/queries.ts` export is wrapped in React `cache()` with `server-only` line 1 — keep the pattern on new queries.
- **Diet claims:** statuses `pending → paid → generating → needs_review → ready` (+ `failed` after 3 strikes, `completed` on cancel; partial unique index `status != 'completed'` untouched); AI output stored as long-form markdown in `diet_document` (claim FK unique), never structured JSON. Claim carries `organization_context` (nullable enum, insurance) + frozen `price_paid`; user retry renders on `generating` only (`failed` is admin-owned). Admin queue at `admin/diet-programs/claims` (approve / retry / request-changes via supportRequests / edit doc / cancel).
- **Periods:** `intake_period` carries a physiology snapshot (history never rewrites); `food_intake.meal_slot` ∈ breakfast/lunch/dinner/snack + nullable `period_id`.
- `proxy.ts` not `middleware.ts` — locale negotiation + optimistic redirects only; every page/action re-verifies session server-side (CVE-2025-29927). Bare links (`/services/...`, `/nutrition/...`) are redirected via `proxy.ts` to `/${locale}/...` preserving searchParams.
- `LocaleSwitcher` replaces path prefix (`segments[0] = nextLocale`) and calls `window.location.assign` for clean RTL/LTR layout and font reloading. Never append locale to path (`/en/ar` is prevented).
- `cookies()`/`headers()`/`params`/`searchParams` are async only (Next 16).
- `postgres.js` results expose `.count` not `.rowCount` (capacity guard).
- `better-auth` adapter uses `usePlural: true`; `role` is `additionalFields` (input:false).
- `localizedRows(entityType, rows, locale, fields, dbc = db)` — 4 args, entityType first; fetches overrides internally (translation queries use Drizzle `inArray`, not raw SQL `ANY`).
- `bookAppointment` → `bookAppointmentWithUser(user, input)` seam for `/api-test` routes.
- Slot capacity guarded by conditional `UPDATE ... booked_count + $party <= capacity` — never reimplement with SELECT+check.
- `generateSlots` uses `SELECT ... FOR UPDATE` on service row to serialize concurrent generation.
- Auth route `src/app/[locale]/(auth)/signin/page.tsx` lives in `(auth)`, NOT inside `(account)` which requires authentication (`await requireUser()`).
- Session cookies in `better-auth` are HMAC SHA-256 signed (`${token}.${sig}`); test login endpoints use `makeSignature` from `better-auth/crypto` and raw cookie value (not `encodeURIComponent` to preserve `=` padding).
- `ClinicalHeader` dynamically subscribes to `authClient.useSession()`, toggling between guest CTA («ورود») and user account dropdown (appointments, notifications, admin panel, sign-out).

## Current state

- **HEAD:** `864538a` (profile-centric nutrition relocation shipped: 9 tasks + fix wave, all reviews clean)
- **Shipped Profile Nutrition Relocation (2026-09-09, spec `docs/superpowers/specs/2026-09-09-profile-nutrition-relocation-design.md`, plan `docs/superpowers/plans/2026-09-09-profile-nutrition-relocation.md`):**
  - **Profile hub:** `/profile` (identity + diets + calorie + body cards), `clinical` (relocated 8-stage registry, honors `?return=`), `diets/[id]` (status timeline + frozen-snapshot banner), `calorie/[id]` (moved tracker), `body` (`weight_log` log + history, physiology sync).
  - **Public wizard:** `/diet` (type → tier → org → payment → registry-check), resumable `pending` claims, snapshot frozen at payment (`registry_snapshot`, idempotent), `/calculator` public BMR page.
  - **Review chain + admin:** generation lands `needs_review`, 3-strike `failed`, admin approve/retry/edit/cancel with `ownerId` enforcement + blank-input guards.
- **Shipped Nutrition Simplification (2026-09-08/09, spec `docs/superpowers/specs/2026-09-08-nutrition-simplification-design.md`):**
  - **4-route IA:** `calorie` (دوره periods: profile snapshot → entries + محاسبه), `diet` (org → type → payment → registry → AI برنامه as plain text), `body` (BMI + profile + registry entry), public `foods` DB. Dashboard, guest funnel, offline-diet stubs, meal-type nuked (~2k lines + 87 locale keys).
  - **AI diet generation:** `ai@7` `generateText` (high maxTokens, Persian long-form), `AI_BASE_URL` switches to OpenAI-compatible provider; no key → clear throw, claim stays `generating` with retry; footer carries specialist-review line.
  - **UX law:** one primary CTA per screen, plain Persian, cards-not-tables, `py-3` targets; layout banner/heroes/duplicate filters deleted.
- **Shipped UI/UX Modernization (Google Stitch 50-Screen System):**
  - **Design System & Tokens:** Tailwind v4 Persian Clinical Wellness palette, Vazirmatn Persian typography, Lucide iconography (migrated from Material Symbols; see Iconography), elevation shadows tier 1–3.
  - **Global Chrome:** `ClinicalHeader` (4 clinical mega-dropdown hubs, locale switcher, session-aware account menu), `ClinicalFooter` (emergency 115 banner, zero-commission guarantee, accreditation seals), `MobileNav` (5-tab mobile dock with route indicators).
  - **Landing Page (Screen 13):** Universal search bar, 360 Health Topics, Live Interactive Metabolism Calculator widget, Doctor Spotlight, Clinical Services, Health Articles, and Trust/Accreditation metrics.
  - **Booking Flow (Screens 2, 4, 11):** Doctors directory with specialty filters, Doctor profile with credentials and schedules, Service catalog with category tabs, Service detail, Slot booking calendar (morning/evening slot categorization), and Digital reservation receipt card.
  - **Nutrition Hub & Tools (Screens 6, 8, 9, 10):** Interactive BMR/TDEE metabolic calculator, Daily food diary with Persian traditional portion measurements and macro progress, Clinical diet programs (diabetes, fatty liver, weight management), and Iranian food nutrition database.
  - **Content & Health Magazine (Screens 1, 3, 5, 7):** Clinical articles catalog, Article reader, 360 Health Topics Care Pathways, Video webinars/self-care guides, and interactive FAQ accordion.
  - **Admin Console & Account (Screens 12, 14, 15):** Unified `AdminShell` layout with sidebar navigation, tables and forms for Doctors, Services, Nutrition, Foods, Content, Support tickets, and Audit logs; Patient Account (`/appointments`, `/notifications`).
  - **Authentication & Multi-language:** Phone-OTP auth, HMAC SHA-256 session token cookies, demo login, 3 full locales (`fa`, `en`, `ar`), clean routing.
  - **Purge Completed:** 5 legacy subsystems purged in migrations 0010-0012 (appointment payments, home-care serviceability, ambulance dispatch, provider portal, support assignment). Booking kernel, nutrition, content, i18n, admin intact.
- **Verification status:** 162 pages built successfully (`next build`), unit suite green (Neon-gated DB tests skip without a branch DB — never run bare `bun run test` where `.env` points at prod), oxlint 0 errors, tsc 0 errors.
- **Next:** Human deferred verification (R10) — `docker compose up -d` → `db:migrate` → all `db:seed*` → `tsc` → `lint` → `test` → `build` → `playwright test`.
- **Manager vision (simplified):** booking for doctors/clinics/services (by specialty/type), rehab/home-care/ambulance as plain `service_type` rows, nutrition body→calorie/nutrient + diet, food/educational blog (article/video/pamphlet/FAQ), 3 locales, accounts/appointments. Paid = downloadable content, not appointment charge.
- **R10 status:** implementation complete; human owns verification. Never commit `.superpowers/`.

## Specs & plans

- Product (what): `angabin-teb-product-spec.md`
- Design (how):
  - Architecture: `docs/superpowers/specs/2026-08-31-angabin-teb-design.md`
  - Purge delta: `docs/superpowers/specs/2026-09-02-angabin-teb-purge-design.md`
  - UI/UX & Stitch: `docs/superpowers/specs/2026-09-04-stitch-ui-ux-design.md` (50 screens)
  - Nutrition simplification: `docs/superpowers/specs/2026-09-08-nutrition-simplification-design.md` (4-route IA + AI برنامه)
- Plans:
  - Architecture Phases 0–4: `docs/superpowers/plans/2026-08-31-angabin-teb-phase-{0..4}-*.md` (shipped)
  - Purge plan: `docs/superpowers/plans/2026-09-02-angabin-teb-purge.md` (shipped)
  - Stitch UI/UX plan: `docs/superpowers/plans/2026-09-04-stitch-ui-ux.md` (shipped)
  - Nutrition simplification plan: `docs/superpowers/plans/2026-09-08-nutrition-simplification.md` (shipped, 7 tasks)
- Ledgers (truth for code state): `.superpowers/sdd/2026-08-31-angabin-teb-phase-{0..4}-*/progress.md`
- Deferred decisions: `OPEN_QUESTIONS.md`

## How to hop in

1. Read this file + the spec for your task (Stitch UI/UX spec if working on UI, purge spec if working on catalog/booking, otherwise the 08-31 design spec).
2. Read the relevant ledger's **Progress** + **Ground truth** — ledger wins over plan text.
3. Check `git log --oneline -10` and `git status`.
4. To verify anything: `docker compose up -d` → `db:migrate` → all `db:seed*` → `test` → `lint` → `build` → `playwright test` + manual flows per plan.

## Gotchas

- Plan files still say `pnpm` in older phases — swept to `bun` in ledgers, use `bun`.
- `messages/*.json` fa is the source of truth; `en`/`ar` are overrides.
- `scripts/` is outside `oxlint src` scope.
- `.env.example` is swallowed by `.gitignore` `.env*` — add `!.env.example` when touching gitignore.
- Bare links (`/services/...`, `/nutrition/...`) rely on `proxy.ts` 307 with searchParams preserved.
- **PG namespace collision:** index names share the schema namespace with tables — `index("intake_period")` on `food_intake` killed migration 0017 (`relation already exists`, whole file rolled back). Name indexes `table_column_idx`.
- **Silent migrate death:** `drizzle-kit migrate` exits 1 printing NOTHING on statement failure — always re-run with output to a file and read the failing statement; or replicate via `drizzle-orm/.../migrator` in a script for visible errors.
