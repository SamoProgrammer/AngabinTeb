# User Dashboard Shell — Design Spec (Approach A: mirror AdminShell, keep `/profile/*`)

Date: 2026-09-11 · Scope: user account IA + header simplification · Roles: user + admin dual-entry
Status: brainstorm-approved (§1–§5 IA + header cut), spec pending human review.
Keeps routes: no rename. `/profile/*` + `/notifications` + `/support/*` stay; nav parents them.

## 0. Context and problems fixed

Audit (2026-09-11) found 12 user screens with no parent shell:

- `src/app/[locale]/(account)/layout.tsx:1` — `requireUser()` + `max-w-4xl` div only, no nav/sidebar/badges.
- `src/app/[locale]/(account)/profile/page.tsx:1` — hub covers only 4 nutrition cards (identity→`./clinical`, diets→`./diets`, calorie→`./calorie`, body→`./body`); booking/messages/account missing.
- Reachable only via header deep links: `src/components/layout/clinical-header.tsx:425` reservations, `:445` personal-info, `:464` balance, `:483` messages, `:502` admin. Missing from desktop menu: diets, calorie, body, clinical, notifications, support.
- `clinical-header.tsx:361` wallet badge duplicates the balance menu entry.
- Mobile drawer `clinical-header.tsx:594` shows only reservations + notifications + admin; desktop/mobile parity broken.
- `src/components/layout/mobile-nav.tsx:24` dock points to `/profile/reservations`, bypassing the hub.
- Every page breadcrumbs Home → page, never Home → Dashboard → page (reservations, balance, personal-info, messages, diets, notifications all orphaned).
- `support/page.tsx`, `support/new/page.tsx`, `support/requests/page.tsx` guarded in `src/proxy.ts` but zero inbound links from header; only reachable from `profile/messages` inline form.
- `clinical-header.tsx` is 691 lines doing 3 jobs: marketing hubs + locale + account dashboard.

Admin contrast `src/components/admin/admin-shell.tsx:37` + `admin/page.tsx:161`: 4 grouped sections, 13 items, live badges, longest-href-wins active, mobile drawer, topbar, overview with queues/stats/quick-actions. User has none of this. Rating 4/10 (IA 2, orientation 3, overview 4, consistency 5, mobile 5).

## 1. Shell + nav IA

- New `src/components/account/user-shell.tsx` mirroring `AdminShell` (same breakpoints, same drawer pattern, same `resolveIcon`, same RTL logical props). Props: `{ children, locale, badges: { reservations, unreadMessages, unreadNotifications, pendingDiets } }`.
- `USER_NAV_GROUPS` (fa source of truth, en/ar overrides):
  - **Overview** — Dashboard `/profile` (`dashboard` icon).
  - **Booking** — My reservations `/profile/reservations` (`calendar_check`, badge: upcoming count).
  - **Nutrition** — My diets `/profile/diets` (badge: pending/generating count), Calorie `/profile/calorie`, Body `/profile/body`, Registry `/profile/clinical`.
  - **Messages** — Inbox `/profile/messages` (badge: unread clinical), Notifications `/notifications` (badge: unread), Support `/support/requests` + `/support/new`.
  - **Account** — Personal info `/profile/personal-info`, Balance `/profile/balance`.
- Shell behavior: desktop grouped sticky sidebar (`md:` breakpoint, `w-64`); mobile drawer opened by hamburger in shell topbar (not header); shell topbar keeps dashboard badge + portal-home link + sign-out; shell canvas `max-w-7xl` like admin (pages drop their own `max-w-3xl/4xl/5xl` + `min-h-screen` wrappers over time, hub first).
- Active state: longest-href-wins copy of `admin-shell.tsx:144` so `diets/[id]` lights `diets`, `calorie/[id]` lights `calorie`; `/notifications` and `/support/*` light their Messages items despite living outside `/profile`.
- Files: add `user-shell.tsx`, add `user-page-header.tsx` (breadcrumb + title + subtitle + primary-action slot, same contract as `admin-page-header.tsx`); extend `(account)/layout.tsx` to fetch badges + wrap in shell; `notifications` route stays where it is but renders inside shell via shared layout (see §4).
- Conventions kept: RTL logical props only, `PendingLink` for in-flow navs, `PendingButton` for server-action submits, Jalali pickers only, `cache()`d DAL reads.

## 2. Dashboard home (overview first)

- Upgrade `profile/page.tsx` (keep route): Row 1 — 4 queue cards with counts + deep links: next appointment (date Jalali + service name or empty), diet claims needing action (pending→payment / paid→check / generating), unread inbox+notifications, balance. Each links to its queue. Row 2 — existing 4 detail cards (identity/diets/calorie/body) kept, relinked under shell paths. Row 3 — quick actions: new booking, new diet, new ticket, edit info.
- States: route `loading.tsx` skeleton; per-card empty "all clear" state; existing `error.tsx` boundary kept. Data via parallel cached DAL reads (`myAppointments`, `myDietClaims`, `listNotifications`, clinical inbox count, wallet balance).
- Badges in layout: `Promise.all` over cached queries, no new tables (ponytail: counts only, not full rows, if traffic grows).

## 3. Shared primitives (2 files only, no new deps)

- `user-page-header.tsx` — breadcrumb (Home / Dashboard / current, native `Link`, route `loading.tsx` covers) + title + subtitle + primary-action slot. Applied to reservations, diets, calorie, body, clinical, messages, personal-info, balance, notifications, support/requests first; `[id]` details attach upward.
- No new table/modal/drawer primitives: user pages stay cards-not-tables per nutrition UX law; confirm modal only where destructive (cancel reservation) reuses existing pattern.
- Rules: every submit shows pending; destructives need confirm; never silent failures.

## 4. Page changes (attach every orphan upward)

- **`(account)/layout.tsx`** — fetch badges, render `UserShell`. `notifications` (outside group) wrapped by moving shell up to `[locale]/layout.tsx`? NO — keep simple: `(account)/layout` + `notifications/page` + `support/*` pages each render `UserShell` via shared `account-shell` server component; no route moves.
- **Reservations** — `UserPageHeader` breadcrumb to Dashboard; keep client filter; primary action new booking (`PendingLink`).
- **Diets + `[id]`** — list keeps status chips; detail breadcrumbs to diets list; resume hrefs unchanged (`diet/payment?claim=`, `diet/check?claim=`, `diets/[id]`).
- **Calorie + `[id]`, Body, Clinical** — header + breadcrumb only; no logic change.
- **Messages** — header + breadcrumb; inline support form kept (it is the `support/new` shortcut); list links to `support/requests`.
- **Notifications** — header + breadcrumb to Dashboard; `markAllRead` keeps `PendingButton`.
- **Support `requests` / `new`** — header + breadcrumb to Dashboard (or Messages); no kernel change.
- **Personal-info / Balance** — header + breadcrumb only; wallet ledger unchanged; no top-up button (no gateway per product vision).
- Cleanup: pages drop redundant `bg-surface min-h-screen py-8 px-4` wrappers once shell canvas lands (hub + reservations first, rest follow-up).

## 5. Header simplification (enter the dashboard, nothing else)

- Delete `clinical-header.tsx:361` wallet badge block.
- Replace authenticated user menu `clinical-header.tsx:374` dropdown (5 deep links + sign-out): user role sees single `My panel` button → `/{locale}/profile`; admin role sees dropdown with exactly 2 items: User panel (`/{locale}/profile`) + Admin console (`/{locale}/admin`). Sign-out moves to `UserShell`/`AdminShell` footers only.
- Mobile drawer `clinical-header.tsx:569`: delete authenticated account card (reservations/notifications/admin/sign-out grid); keep login CTA for guests + marketing hub accordion only. Account actions live in `UserShell` drawer.
- `mobile-nav.tsx:24`: appointments tab retargets `/{locale}/profile/reservations` → `/{locale}/profile` so the hub is one tap; reservations stays one more tap inside.
- `LocaleSwitcher`, 4 mega-hubs, guest login CTA (`toSignin` + `returnUrl` law) unchanged. `proxy.ts` guarded list unchanged (no route moves). `isSafeReturn`/`signedInTarget` unchanged.
- Deletions are net-negative lines: header shrinks ~691 → ~450 lines; no new deps.

## 6. Cross-cutting

- **i18n**: fa truth; en/ar overrides for `account.shell.groups.*`, queue cards, header `userMenu.dashboard/adminConsole`, empty/error strings. Reuse `header.userMenu` keys where possible; add `account.shell.*` + `account.overview.*`.
- **Errors**: per-section `error.tsx` kept; server-action form errors inline; badge fetch failures degrade to zero badges (shell still renders).
- **Loading**: route skeletons + `PendingLink` on queue cards/tabs + `PendingButton` on submits, per pending-feedback law. Breadcrumbs stay native `Link`.
- **Data**: reuse cached DAL (`myAppointments`, `myDietClaims`, `listPeriods`, `getPhysiology`, `listNotifications`, inbox query, wallet query); add count-only variants only if measured slow; no schema/migration change.
- **Testing**: `bunx tsc --noEmit` 0, `bun run lint` 0, vitest for badge selectors + active-href longest-wins, Playwright user journey (header → dashboard → reservations → diets → messages → support new). E2E needs seeded dev server.
- **Rollout order**: shell + header cut → dashboard overview → headers/breadcrumbs on reservations/diets/messages → remaining pages → wrapper dedup last.
- **Self-review**: no TBDs; no contradictions (routes frozen, nav parents outside roots); single-plan scope (no RBAC, no rename, no gateway); no ambiguous requirements (admin gets exactly 2 dropdown items; sign-out only in shells).

## 7. Non-goals

No `/dashboard` rename (deferred; redirects + proxy churn not worth it now); no RBAC/multi-role gates (groups ready for roles later); no new UI deps; no client-heavy grids; no schema changes; no public-surface changes; no wallet top-up gateway.
