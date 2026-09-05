<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Angabin Teb — Agent Brief

> **One-line:** Persian health platform — booking (doctors/clinics/services), nutrition (body→BMR/TDEE + food diary + diet), content (articles/videos/FAQ by topic), 3 locales, phone-OTP auth.
> **Read this first, then the spec. This file is the handoff; `docs/` is the depth.**

## Stack

Next 16.3.3 · React 19 · TS 7.0.2 (oxlint only, NO typescript-eslint) · Tailwind v4 · Drizzle 0.45 + postgres.js 3.4 · better-auth 1.7.2 · next-intl 4 · Node 26.7 · Postgres 17 (docker compose) · **bun** (never pnpm/npm/yarn).

## Where things live

```
src/app/[locale]/          # App Router — (discovery) (booking) (account) (auth) (nutrition) (content) (marketing) admin/
src/contexts/{identity,catalog,booking,nutrition,content,support}/  # kernel.ts queries.ts actions.ts model.ts
src/db/schema/             # one file per context + index.ts barrel
src/components/ui/         # shadcn (base-ui variant) vendored
messages/{fa,en,ar}.json   # next-intl catalogs (fa default)
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

- `proxy.ts` not `middleware.ts` — locale negotiation + optimistic redirects only; every page/action re-verifies session server-side (CVE-2025-29927).
- `cookies()`/`headers()`/`params`/`searchParams` are async only (Next 16).
- `postgres.js` results expose `.count` not `.rowCount` (capacity guard).
- `better-auth` adapter uses `usePlural: true`; `role` is `additionalFields` (input:false).
- `overlayTranslations(entityType, rows, overrides, locale, fields)` — 5 args, entityType first, locale in key.
- `fetchOverrides` is same-file helper in `catalog/queries.ts`, not exported.
- Translation = base Persian column + non-Persian overrides in `translation` table; FTS indexes base column.
- RTL via logical props (`ps/pe`, `text-start`, `pe-8`) — not physical (`pr/pl`).
- `bookAppointment` → `bookAppointmentWithUser(user, input)` seam for `/api-test` routes.
- Slot capacity guarded by conditional `UPDATE ... booked_count + $party <= capacity` — never reimplement with SELECT+check.
- `generateSlots` uses `SELECT ... FOR UPDATE` on service row to serialize concurrent generation.
- Auth route `src/app/[locale]/(auth)/signin/page.tsx` lives in `(auth)`, NOT inside `(account)` which requires authentication (`await requireUser()`).
- Session cookies in `better-auth` are HMAC SHA-256 signed (`${token}.${sig}`); test login endpoints use `makeSignature` from `better-auth/crypto` and raw cookie value (not `encodeURIComponent` to preserve `=` padding).
- `ClinicalHeader` dynamically subscribes to `authClient.useSession()`, toggling between guest CTA («ورود») and user account dropdown (appointments, notifications, admin, sign-out).
- `LocaleSwitcher` replaces path prefix (`segments[0] = nextLocale`) and performs full reload for clean RTL/LTR layout and fonts.

## Current state

- **HEAD:** `4a43580` (auth header session menu, signin loop fix, i18n cleanups)
- **Last shipped:**
  - Header mega-dropdown navigation: 4 clinical hubs (Appointments, Nutrition, Content, Support) + responsive mobile drawer + reactive user session menu with appointments, notifications, admin panel, and sign-out.
  - Auth route and demo login: Moved `/signin` to `(auth)` group, eliminating infinite 307 loop from `requireUser()`; HMAC SHA-256 session token signing for instant one-click test login; better-auth baseURL configuration.
  - Multilingual & routing: Fixed locale switcher preventing dirty URLs like `/en/ar`; completed English (`en`) and Arabic (`ar`) dictionaries; switched Postgres translation queries to Drizzle `inArray`.
  - Purge of 5 legacy subsystems completed in migrations 0010-0012.
- **Verification status:** 108 routes built successfully (`next build`), 91 unit tests passing (`vitest`), oxlint 0 errors, tsc 0 errors.
- **Next:** Human deferred verification (R10) — `docker compose up -d` → `db:migrate` → all `db:seed*` → `tsc` → `lint` → `test` → `build` → `playwright test`.
- **Manager vision (simplified):** booking for doctors/clinics/services (by specialty/type), rehab/home-care/ambulance as plain `service_type` rows, nutrition body→calorie/nutrient + diet, food/educational blog (article/video/pamphlet/FAQ), 3 locales, accounts/appointments. Paid = downloadable content, not appointment charge.
- **Purge deleted:** appointment payments (`pending`/`paid_online`), home-care `home_city_id`+serviceability, ambulance `dispatch_record`, provider portal, support `assignee_user_id`. Keeps: booking kernel, nutrition, content, i18n, admin. Migrations 0010+ drop the columns/tables.
- **R10 status:** implementation complete; human owns verification. Never commit `.superpowers/`.

## Specs & plans

- Product (what): `angabin-teb-product-spec.md`
- Design (how): `docs/superpowers/specs/2026-08-31-angabin-teb-design.md` + purge delta `2026-09-02-angabin-teb-purge-design.md`
- Plans: `docs/superpowers/plans/2026-08-31-angabin-teb-phase-{0..4}-*.md` (shipped) + `2026-09-02-angabin-teb-purge.md` (next)
- Ledgers (truth for code state): `.superpowers/sdd/2026-08-31-angabin-teb-phase-{0..4}-*/progress.md` + purge ledger when created
- Deferred decisions: `OPEN_QUESTIONS.md` (will be trimmed by purge)

## How to hop in

1. Read this file + the spec for your task (purge spec if you're purging, otherwise the 08-31 design spec).
2. Read the relevant ledger's **Progress** + **Ground truth** — ledger wins over plan text.
3. Check `git log --oneline -10` and `git status`.
4. To run purge: paste the prompt from the purge plan's handoff (plan header) into a new session — it carries the full setup + rulings.
5. To verify anything: `docker compose up -d` → `db:migrate` → all `db:seed*` → `test` → `lint` → `build` → `playwright test` + manual flows per plan.

## Gotchas

- Plan files still say `pnpm` in older phases — swept to `bun` in ledgers, use `bun`.
- `messages/*.json` fa is the source of truth; `en`/`ar` are overrides.
- `scripts/` is outside `oxlint src` scope.
- `.env.example` is swallowed by `.gitignore` `.env*` — add `!.env.example` when touching gitignore.
- Bare links (`/services/...`) rely on `proxy.ts` 307 with searchParams preserved.
