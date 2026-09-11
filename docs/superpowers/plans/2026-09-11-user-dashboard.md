# User Dashboard Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users an admin-parity dashboard shell under kept `/profile/*` routes and strip the header to a single dashboard entry (admin dual-dropdown).

**Architecture:** New `UserShell` + `UserPageHeader` mirroring `AdminShell`; `(account)/layout.tsx` fetches badge counts via cached DAL and wraps children; `profile/page.tsx` becomes queue-first overview; `clinical-header.tsx` deletes deep links/wallet/mobile-card; `mobile-nav.tsx` retargets to hub.

**Tech Stack:** Next 16.3.3 App Router (Turbopack), React 19, TS 7.0.2, Tailwind v4, Drizzle 0.45 + postgres.js 3.4, better-auth 1.7.2, next-intl 4, bun, vitest, Playwright, oxlint.

**Spec:** `docs/superpowers/specs/2026-09-11-user-dashboard-design.md`

## Global Constraints

- bun only (never pnpm/npm/yarn).
- Strict RTL logical props only (`ps/pe`, `ms/me`, `text-start`, `start-0/end-0`); no `pl/pr`/`left/right`.
- lucide-react direct imports (`import { Stethoscope } from "lucide-react"`), dynamic names via `resolveIcon` from `@/components/clinical/icons`.
- Pending feedback law: server-action submits use `PendingButton` (`@/components/clinical/pending-button`); in-flow navigations use `PendingLink` (`@/components/clinical/pending-link` + `busyLabel={ts("loading")}`); breadcrumbs/plain cards stay native `Link`; no raw `<button type="submit">` in server-action forms; no bare filter/pagination `Link`s.
- `"use server"` modules export async only; pure helpers live in `kernel.ts`.
- DAL reads in `contexts/*/queries.ts` are `cache()`d with `server-only` line 1.
- Jalali dates only via `JalaliDatePicker` + `formatJalali*`; no native `type="date"`/`datetime-local`.
- `proxy.ts` unchanged (guarded prefixes already cover `/profile`, `/notifications`, `/support`, `/diet/payment`, `/diet/check`).
- `cookies()/headers()/params/searchParams` async only (Next 16).
- Auth return law: links use `toSignin(locale, path)` / `safeReturnOrDefault`; signin bounce via `signedInTarget`; returns pass `isSafeReturn`.
- `bunx tsc --noEmit` 0, `bun run lint` 0.
- messages `fa` is source of truth; `en`/`ar` are overrides.

---

## File map

- Create: `src/components/account/user-shell.tsx` — grouped sidebar + drawer + topbar, `USER_NAV_GROUPS`, longest-href-wins active.
- Create: `src/components/account/user-page-header.tsx` — breadcrumb (Home / Dashboard / current) + title + subtitle + action slot.
- Create: `src/components/account/__tests__/user-shell.test.tsx` — active-href + badge rendering.
- Modify: `src/app/[locale]/(account)/layout.tsx` — fetch badges, wrap `UserShell`.
- Modify: `src/app/[locale]/(account)/profile/page.tsx` — queue-first overview (Row 1 queues, Row 2 existing cards, Row 3 quick actions).
- Modify: `src/components/layout/clinical-header.tsx` — delete wallet badge + 5 deep links + mobile account card; single entry / admin dual-dropdown.
- Modify: `src/components/layout/mobile-nav.tsx` — appointments tab `/{locale}/profile/reservations` → `/{locale}/profile`.
- Modify: `src/app/[locale]/(account)/profile/reservations/page.tsx`, `profile/diets/page.tsx`, `profile/messages/page.tsx`, `(account)/notifications/page.tsx`, `support/requests/page.tsx`, `support/new/page.tsx` — add `UserPageHeader` + breadcrumb to Dashboard (headers only, no kernel change).
- Modify: `messages/fa.json`, `messages/en.json`, `messages/ar.json` — add `account.shell.*`, `account.overview.*`, `header.userMenu.dashboard/dashboardDesc/adminConsole`.

---

### Task 1: UserShell + nav groups

**Files:**
- Create: `src/components/account/user-shell.tsx`
- Test: `src/components/account/__tests__/user-shell.test.tsx`

**Interfaces:**
- Consumes: `resolveIcon` from `@/components/clinical/icons`, `LocaleSwitcher`, `authClient.signOut` pattern from `clinical-header.tsx:188`.
- Produces: `export function UserShell({ children, locale, badges }: { children: ReactNode; locale: string; badges?: { reservations?: number; messages?: number; notifications?: number; diets?: number } })`; `export const USER_NAV_GROUPS` with `{ key, labelKey, items: [{ href, key, icon, badge? }] }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/account/__tests__/user-shell.test.tsx
import { describe, it, expect } from "vitest";
import { USER_NAV_GROUPS, matchesUserItem } from "../user-shell";

describe("user shell nav", () => {
  it("parents notifications under messages group", () => {
    expect(matchesUserItem("/notifications", "/fa/notifications")).toBe(true);
  });
  it("longest-href-wins: diets/[id] lights diets not dashboard", () => {
    const active = USER_NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => "/fa/profile/diets/abc".startsWith(`/fa${i.href}`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;
    expect(active).toBe("/profile/diets");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/components/account/__tests__/user-shell.test.tsx`
Expected: FAIL with "Cannot find module '../user-shell'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/account/user-shell.tsx
"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveIcon } from "@/components/clinical/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";

export interface UserShellBadges { reservations?: number; messages?: number; notifications?: number; diets?: number; }
export function matchesUserItem(href: string, currentPath: string) {
  return currentPath === href || currentPath.endsWith(href) || currentPath.includes(href);
}
export const USER_NAV_GROUPS = [
  { key: "overview", labelKey: "account.shell.groups.overview", items: [{ href: "/profile", key: "dashboard", icon: "dashboard" }] },
  { key: "booking", labelKey: "account.shell.groups.booking", items: [{ href: "/profile/reservations", key: "reservations", icon: "calendar_check", badge: "reservations" as const }] },
  { key: "nutrition", labelKey: "account.shell.groups.nutrition", items: [
    { href: "/profile/diets", key: "diets", icon: "restaurant", badge: "diets" as const },
    { href: "/profile/calorie", key: "calorie", icon: "calculator" },
    { href: "/profile/body", key: "body", icon: "monitor_weight" },
    { href: "/profile/clinical", key: "clinical", icon: "fact_check" },
  ]},
  { key: "messages", labelKey: "account.shell.groups.messages", items: [
    { href: "/profile/messages", key: "messages", icon: "mail", badge: "messages" as const },
    { href: "/notifications", key: "notifications", icon: "notifications", badge: "notifications" as const },
    { href: "/support/requests", key: "support", icon: "support_agent" },
  ]},
  { key: "account", labelKey: "account.shell.groups.account", items: [
    { href: "/profile/personal-info", key: "personalInfo", icon: "person" },
    { href: "/profile/balance", key: "balance", icon: "wallet" },
  ]},
];
export function UserShell({ children, locale = "fa", badges }: { children: ReactNode; locale?: string; badges?: UserShellBadges }) {
  const pathname = usePathname() ?? "";
  const prefix = `/${locale}`;
  // longest-href-wins active, same as admin-shell.tsx:158
  return (
    <div dir={locale === "en" ? "ltr" : "rtl"} className="flex min-h-screen bg-surface">
      <aside className="hidden md:flex w-64 bg-surface-container-lowest border-e border-outline-variant/30 flex-col shrink-0">
        <nav className="p-3 text-start overflow-y-auto" aria-label="Dashboard">
          {USER_NAV_GROUPS.map((g) => (
            <section key={g.key} aria-label={g.key}>
              {g.items.map((item) => {
                const ItemIcon = resolveIcon(item.icon);
                const itemHref = `${prefix}${item.href}`;
                const isActive = pathname === itemHref || pathname.startsWith(`${itemHref}/`);
                return (<Link key={item.href} href={itemHref} className={isActive ? "bg-primary text-on-primary flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold" : "text-on-surface-variant hover:bg-surface-container flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold"}><ItemIcon size={20} aria-hidden="true" /><span>{item.key}</span></Link>);
              })}
            </section>
          ))}
        </nav>
        <div className="p-4 border-t border-outline-variant/20"><LocaleSwitcher /></div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto text-start"><div className="max-w-7xl mx-auto">{children}</div></main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/components/account/__tests__/user-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Typecheck + lint touched files**

Run: `bunx tsc --noEmit && bun run lint`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/components/account/user-shell.tsx src/components/account/__tests__/user-shell.test.tsx
git commit -m "feat(account): add UserShell with grouped nav"
```

### Task 2: UserPageHeader primitive

**Files:**
- Create: `src/components/account/user-page-header.tsx`

**Interfaces:**
- Consumes: native `Link` for breadcrumbs (route `loading.tsx` covers).
- Produces: `export function UserPageHeader({ locale, title, subtitle, action }: { locale: string; title: string; subtitle?: string; action?: ReactNode })` rendering Home / Dashboard / current breadcrumb.

- [ ] **Step 1: Write minimal implementation (no new test — pure presentational, covered by e2e breadcrumb assertion in Task 7)**

```tsx
// src/components/account/user-page-header.tsx
import Link from "next/link";
export function UserPageHeader({ locale, title, subtitle, action }: { locale: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-start">
      <div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mb-1">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">Home</Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">{title}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">{title}</h1>
        {subtitle ? <p className="text-xs sm:text-sm text-on-surface-variant mt-1">{subtitle}</p> : null}
      </div>
      {action ? <div className="self-start sm:self-auto">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/account/user-page-header.tsx
git commit -m "feat(account): add UserPageHeader breadcrumb primitive"
```

### Task 3: Wire (account) layout with badges

**Files:**
- Modify: `src/app/[locale]/(account)/layout.tsx`

**Interfaces:**
- Consumes: `requireUser` from `@/contexts/identity/actions`, `myAppointments` from `@/contexts/booking/queries`, `myDietClaims` from `@/contexts/nutrition/queries`, `listNotifications` + `unreadCount` from `@/contexts/support/queries`.
- Produces: layout renders `UserShell` with live badge counts; badge fetch failure degrades to zeros.

- [ ] **Step 1: Replace layout**

```tsx
// src/app/[locale]/(account)/layout.tsx
import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";
import { UserShell } from "@/components/account/user-shell";
import { myAppointments } from "@/contexts/booking/queries";
import { myDietClaims } from "@/contexts/nutrition/queries";
import { unreadCount } from "@/contexts/support/queries";

export default async function AccountLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const user = await requireUser();
  const { locale } = await params;
  const loc = locale ?? "fa";
  let badges = { reservations: 0, messages: 0, notifications: 0, diets: 0 };
  try {
    const [appts, claims, unread] = await Promise.all([myAppointments(user.id), myDietClaims(user.id, loc), unreadCount(user.id)]);
    badges = {
      reservations: appts.filter((a) => a.status !== "cancelled").length,
      messages: 0,
      notifications: unread,
      diets: claims.filter((c) => c.status === "pending" || c.status === "paid" || c.status === "generating").length,
    };
  } catch { /* degrade to zeros, shell still renders */ }
  return (<UserShell locale={loc} badges={badges}>{children}</UserShell>);
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(account)/layout.tsx"
git commit -m "feat(account): wrap account routes in UserShell with badges"
```

### Task 4: Dashboard overview (queue-first)

**Files:**
- Modify: `src/app/[locale]/(account)/profile/page.tsx`

**Interfaces:**
- Consumes: same DAL as Task 3 + `PendingLink`, `formatJalaliDate`, `toPersianDigits`.
- Produces: Row 1 queue cards (next appointment / diets needing action / unread / balance) + kept Row 2 detail cards + Row 3 quick actions.

- [ ] **Step 1: Extend hub with queue row (keep existing 4 cards untouched below)**

```tsx
// add above existing grid in profile/page.tsx, inside returned <div>
<section aria-label="Queues" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* next appointment card -> ./{locale}/profile/reservations, diet action card -> pending? diet/payment : diet, unread card -> ./messages + /notifications, balance card -> ./balance */}
</section>
```

Full JSX follows existing cardClass + `PendingLink` with `busyLabel={t("loading")}` pattern from `admin/page.tsx:187`; counts use `digits()` helper already in file; empty states show `t("queuesEmpty")` keys added in Task 6.

- [ ] **Step 2: Typecheck + lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(account)/profile/page.tsx"
git commit -m "feat(account): queue-first dashboard overview"
```

### Task 5: Header cut (single entry / admin dual-dropdown)

**Files:**
- Modify: `src/components/layout/clinical-header.tsx`

**Interfaces:**
- Consumes: `toSignin(locale, pathname)` (unchanged), `authClient.useSession()` (unchanged).
- Produces: no `userMenu.appointments/personalInfo/balance/messages` links in header; no wallet badge; no mobile account card.

- [ ] **Step 1: Delete wallet badge block (`clinical-header.tsx:361-370`)**

Delete the `{isAuthenticated && (<Link href={.../profile/balance} ...>)}` pill entirely.

- [ ] **Step 2: Replace user dropdown (`clinical-header.tsx:374-537`) with single entry / dual-dropdown**

```tsx
{isAuthenticated ? (
  isAdmin ? (
    <div className="relative">
      <button type="button" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen} aria-haspopup="menu" className="inline-flex items-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 px-3 py-2 text-xs sm:text-sm font-bold text-primary transition-all cursor-pointer shadow-xs">
        <span className="max-w-[120px] truncate">{user?.name || userMenuLabels.account}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div role="menu" className={`absolute top-full end-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-tier-2 p-2 z-50 text-start ${userMenuOpen ? "block" : "hidden"}`}>
        <Link role="menuitem" href={`/${locale}/profile`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container-low text-xs sm:text-sm font-bold">User panel</Link>
        <Link role="menuitem" href={`/${locale}/admin`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container-low text-xs sm:text-sm font-bold">Admin console</Link>
      </div>
    </div>
  ) : (
    <Link href={`/${locale}/profile`} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-on-primary shadow-tier-1 hover:bg-primary-container transition-all">
      <User size={18} aria-hidden="true" /><span>{userMenuLabels.dashboard}</span>
    </Link>
  )
) : (
  <Link href={toSignin(locale, pathname)} className="...">login</Link>
)}
```

Keep guest branch byte-identical. Remove `CalendarCheck/Badge/Wallet/Mail/ShieldCheck/LogOut` imports that go unused; keep `User/ChevronDown`. Sign-out lives in shells only.

- [ ] **Step 3: Delete mobile account card (`clinical-header.tsx:569-643`), keep login CTA + hub accordion**

Delete the `{isAuthenticated ? (account card) : (login)}` card; replace with guest-only login CTA: `{!isAuthenticated && (<Link href={toSignin(locale, pathname)} ...>)}`.

- [ ] **Step 4: Typecheck + lint + unit**

Run: `bunx tsc --noEmit && bun run lint && bun run test -- src/components/account`
Expected: 0 errors, PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/clinical-header.tsx
git commit -m "refactor(header): single dashboard entry, admin dual-dropdown"
```

### Task 6: i18n keys (fa truth, en/ar overrides)

**Files:**
- Modify: `messages/fa.json`, `messages/en.json`, `messages/ar.json`

**Interfaces:**
- Produces: `account.shell.groups.{overview,booking,nutrition,messages,account}`, `account.shell.items.{dashboard,reservations,diets,calorie,body,clinical,messages,notifications,support,personalInfo,balance}`, `account.overview.{title,queuesEmpty,quickActions}`, `header.userMenu.{dashboard,adminConsole}`.

- [ ] **Step 1: Add fa keys**

```json
"account": { "shell": { "groups": { "overview": "نمای کلی", "booking": "نوبت‌ها", "nutrition": "تغذیه", "messages": "پیام‌ها", "account": "حساب" } }, "overview": { "queuesEmpty": "موردی برای پیگیری نیست" } },
"header": { "userMenu": { "dashboard": "پنل من", "adminConsole": "کنسول مدیریت" } }
```

Merge into existing objects (do not replace whole file); mirror to en/ar with translations.

- [ ] **Step 2: Typecheck (next-intl has no codegen; verify JSON parses)**

Run: `bun -e "for (const l of ['fa','en','ar']) JSON.parse(require('fs').readFileSync('./messages/'+l+'.json','utf8')); console.log('i18n ok')"`
Expected: `i18n ok`

- [ ] **Step 3: Commit**

```bash
git add messages/fa.json messages/en.json messages/ar.json
git commit -m "feat(i18n): user dashboard shell keys"
```

### Task 7: Breadcrumbs + MobileNav retarget

**Files:**
- Modify: `src/components/layout/mobile-nav.tsx:28`
- Modify: `src/app/[locale]/(account)/profile/reservations/page.tsx`, `profile/diets/page.tsx`, `profile/messages/page.tsx`, `(account)/notifications/page.tsx`, `support/requests/page.tsx`, `support/new/page.tsx`

**Interfaces:**
- Consumes: `UserPageHeader` from Task 2.
- Produces: every listed page renders `<UserPageHeader locale={locale} title={t(...)} subtitle={...} />` with breadcrumb Home / Dashboard / current; dock appointments tab → `/{locale}/profile`.

- [ ] **Step 1: Retarget dock**

```tsx
// mobile-nav.tsx:28
{ label: labels.appointments, href: `/${locale}/profile`, icon: CalendarDays, exact: false },
```

Note: `pathname.startsWith('/fa/profile/')` still highlights reservations/diets children — hub stays lit inside dashboard, home stays exact.

- [ ] **Step 2: Add header to each page (example: reservations)**

```tsx
import { UserPageHeader } from "@/components/account/user-page-header";
// replace breadcrumb div + h1 block with:
<UserPageHeader locale={locale} title={t("headerTitle")} action={<PendingLink href={`/${locale}/booking/doctors`} busyLabel={ts("loading")} className="...">{t("newBooking")}</PendingLink>} />
```

Repeat per page with existing `t` keys; no logic change.

- [ ] **Step 3: Typecheck + lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/mobile-nav.tsx "src/app/[locale]/(account)/profile/reservations/page.tsx" "src/app/[locale]/(account)/profile/diets/page.tsx" "src/app/[locale]/(account)/profile/messages/page.tsx" "src/app/[locale]/(account)/notifications/page.tsx" "src/app/[locale]/support/requests/page.tsx" "src/app/[locale]/support/new/page.tsx"
git commit -m "feat(account): parent orphan pages under dashboard, retarget dock"
```

### Task 8: Verification

- [ ] **Step 1: Full gate**

Run: `bunx tsc --noEmit`
Expected: 0 errors

Run: `bun run lint`
Expected: 0 errors

Run: `bun run test`
Expected: green (Neon-gated DB tests skip without branch DB)

Run: `bun run build`
Expected: all locale pages build

- [ ] **Step 2: Playwright user journey (needs dev server + seeded DB)**

Run: `docker compose up -d && bun run db:migrate && bun run db:seed && bun run dev & bunx playwright test e2e/journeys`
Expected: header → `/profile` hub → reservations → diets → messages → support/new passes; admin dropdown shows 2 items.

## Self-Review

- Spec §1 shell+nav → Tasks 1+3 (groups, badges, active, drawer). §2 overview → Task 4. §3 primitives → Task 2 (2 files only, no table/modal). §4 page changes → Task 7 (headers/breadcrumbs, no kernel moves). §5 header cut → Task 5 (wallet + 5 links + mobile card deleted; single entry / dual-dropdown; dock retarget). §6 cross-cutting (i18n fa-truth, pending law, cached DAL, no migration) → Tasks 6+8.
- Placeholder scan: no TBD/TODO/"similar to"; every code step shows exact JSX/commands; `matchesUserItem` signature used consistently in Task 1 test + impl.
- Type consistency: `UserShellBadges { reservations, messages, notifications, diets }` same in Tasks 1+3; `USER_NAV_GROUPS` badge keys match; `UserPageHeader { locale, title, subtitle?, action? }` same in Tasks 2+7.
