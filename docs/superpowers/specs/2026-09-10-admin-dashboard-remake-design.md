# Admin Dashboard Remake — Design Spec (Approach B: Command Center)

Date: 2026-09-10 · Scope: full remake · Roles: single admin · Dashboard job: ops queue first
Status: brainstorm-approved (§1–§5), spec approved, plan at `docs/superpowers/plans/2026-09-10-admin-dashboard-remake.md`.

## 0. Context and problems fixed

Audit (2026-09-10) found: 12 flat sidebar items in `src/components/admin/admin-shell.tsx:16`;
`admin/diet-programs/claims` orphan with zero inbound links; 2 dashboard stat cards
(users, translations → `admin/settings`) misdirecting to an integrations-only page;
zero breadcrumbs/back-links on all 6 `[id]` detail pages; `admin/scheduling` a bare
doctor list linking to provider slots tabs; `admin/support` hardcoded `open`-only;
`admin/foods` with no create path; fixed `w-64` sidebar with no mobile story; tables
without search/sort/pagination (services has the only filter). Topbar is a static badge
with no user/sign-out.

## 1. Shell + nav IA

- Grouped sidebar (replaces flat 12): **Operations** (Dashboard, Diet claims ★ with
  live `needs_review` badge, Support with `open` badge, Scheduling), **Catalog**
  (Providers, Services, Categories, Locations), **Knowledge** (Content, Topics,
  Foods, Diet programs), **System** (Settings). Claims is first-class; badges from
  cached DAL counts (`Promise.all`, no new tables).
- Shell behavior: desktop grouped sticky sidebar with section labels; mobile drawer
  (`md:` breakpoint) opened by hamburger in topbar; topbar keeps admin badge, adds
  search-link (focuses the current section's table search field) + sign-out next to `LocaleSwitcher`.
- `PageHeader` on every non-dashboard page: breadcrumb to parent list + title +
  subtitle + primary-action slot. Detail/`new` pages attach upward; fixes orphan class.
- Active state matches section prefix including `[id]` and `new` (extends current
  `startsWith` logic in `admin-shell.tsx:112-116`); longest-href-wins so claims does
  not light up diet-programs.
- Files: extend `src/components/admin/admin-shell.tsx`, add
  `src/components/admin/admin-page-header.tsx`, nav/group keys in
  `messages/{fa,en,ar}.json` (fa source of truth).
- Conventions kept: RTL logical props only, `resolveIcon` for icons, `PendingLink`
  for in-flow navigations, `PendingAdminButton` for shadcn submits, `JalaliDatePicker`
  the only date path.

## 2. Dashboard home (queue first)

- Row 1 — 4 queue cards with counts + deep links: claims `needs_review`, claims
  `failed`, open support tickets, today's bookings (Jalali day, Asia/Tehran). Each shows oldest-waiting age
  (Jalali relative) and links to the filtered queue.
- Row 2 — honest metrics strip only: providers, services, appointments, content,
  each to its real list. Users/translations counts are dropped unless their screens
  exist (kills the 2 misdirects).
- Row 3 — quick actions: new provider, new service, new content, generate slots.
- States: route `loading.tsx` skeleton; per-card empty "all clear" state; existing
  admin `error.tsx` boundary kept. Data via parallel cached DAL reads.

## 3. Shared primitives (4 files only, no new deps)

- `admin-table.tsx` — server-rendered shadcn table: header search field, column sort
  via `searchParams`, URL pagination, row action menu (view/edit), loading skeleton rows,
  empty state with create CTA, errors thrown to boundary.
- `admin-page-header.tsx` — breadcrumb + title + subtitle + primary-action slot.
- `confirm-action.tsx` — single client confirm modal for deletes/cancels/claim-cancel,
  wraps `PendingAdminButton`, blank-input guard.
- `form-drawer.tsx` — side drawer for quick create (topic, category) reusing existing
  server actions; complex edits stay on full `[id]` pages.
- Rules: every submit shows pending; destructives need confirm; never silent failures.

## 4. Page changes

- **Claims**: status tabs (all/pending/paid/generating/needs-review/ready/failed), age
  column, snapshot peek, approve/retry/request-changes/edit-doc/cancel via
  `ConfirmAction`; existing poller kept.
- **Support**: tabs open/in-progress/resolved/closed (not open-only), priority badge,
  status-change action with pending + confirm on close.
- **Providers**: search + kind filter + pagination; detail keeps 4 tabs
  (profile/schedules/slots/bookings) under `PageHeader` breadcrumb.
- **Services**: keep type filter; add search + provider filter + pagination.
- **Categories/Locations/Topics**: `AdminTable` + drawer quick-create; delete behind
  confirm; locations keeps provider join + city display.
- **Foods**: add missing create form; serving-unit editor stays; nutrients grid stays
  server-rendered.
- **Content**: kind/status filters + search + pagination.
- **Diet programs**: header links to claims queue; program CRUD unchanged.
- **Scheduling**: date-grouped slot board (today/next-7-days) linking into provider
  slots tabs instead of bare doctor list.
- **Settings**: integrations table unchanged; no fake user/translation UI added.

## 5. Cross-cutting

- **i18n**: fa truth; en/ar overrides for nav groups, queue cards, table/modal/
  empty/error strings.
- **Errors**: per-section `error.tsx` + inline server-action form errors; delete
  failures surface with retry.
- **Loading**: route skeletons + `PendingAdminButton` + `PendingLink` on queue cards
  and tabs, per pending-feedback law.
- **Data**: reuse cached DAL `queries.ts`; add count/filtered-list variants only;
  no schema/migration change.
- **Testing**: `bunx tsc --noEmit` 0, `bun run lint` 0, vitest for badge counts + tab
  filters, Playwright admin journey (dashboard queue → claim approve, support resolve).
- **Rollout order**: shell+header → dashboard → primitives → Operations pages →
  Catalog → Knowledge → settings last.

## 6. Non-goals

No RBAC/multi-role gates (nav grouped so roles can be added later); no new UI deps;
no client-heavy grids; no schema changes; no public-surface changes.
