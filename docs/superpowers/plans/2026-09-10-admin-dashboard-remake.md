# Admin Dashboard Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remake the admin console into a grouped command-center shell with a queue-first dashboard and consistent tables, states, and confirmations on every section.

**Architecture:** Server-first evolution, no restructuring: extend `AdminShell` with nav groups/badges/drawer, add 4 small shared components, convert each list page to URL-param search/filter/paginate with in-page slice, give claims and support status tabs, and point the dashboard at real queues. No schema change, no new dependencies.

**Tech Stack:** Next 16 App Router, React 19, Tailwind v4 (logical props only), shadcn vendored UI, Drizzle + postgres.js, next-intl (fa truth), vitest + Playwright.

**Spec:** `docs/superpowers/specs/2026-09-10-admin-dashboard-remake-design.md`

## Global Constraints

- `bun` only, never pnpm/npm/yarn.
- `bunx tsc --noEmit` must be 0; `bun run lint` (oxlint src) must be 0.
- RTL logical Tailwind props only (`ps/pe`, `ms/me`, `text-start`, `start-0/end-0`); `pl/pr/left/right` forbidden.
- lucide-react direct imports or `resolveIcon(name)` from `@/components/clinical/icons`; no icon font.
- Pending law: server-action submits use `PendingAdminButton`; GET filter forms use `PendingSubmit`; in-flow nav (tabs, queue cards, pagination) uses `PendingLink` with `busyLabel`; breadcrumbs stay native `Link`.
- `"use server"` modules export async functions only; pure helpers live in plain modules.
- DAL reads stay wrapped in React `cache()` with `server-only` import.
- Dates via `JalaliDatePicker` + `formatJalali*`; native `type="date"` forbidden.
- `messages/fa.json` is source of truth; `en`/`ar` are overrides.
- Tables ≤100 rows filter/slice in-page with a `ponytail:` ceiling comment; DB-level pagination only when a table exceeds 200 rows.

---

## File map

| File | Responsibility |
|---|---|
| `src/components/admin/list-params.ts` (create) | Pure URL-param parsing + pagination slicing (Task 1) |
| `src/components/admin/__tests__/list-params.test.ts` (create) | Unit tests for Task 1 |
| `src/components/admin/admin-shell.tsx` (modify) | Grouped nav, badges, mobile drawer, sign-out (Task 2) |
| `src/components/admin/admin-page-header.tsx` (create) | Breadcrumb + title + action header (Task 2) |
| `src/components/admin/__tests__/admin-chrome.test.tsx` (create) | renderToString tests for Task 2 |
| `src/app/[locale]/admin/layout.tsx` (modify) | Badge counts for shell (Task 2) |
| `src/components/admin/admin-table.tsx` (create) | Toolbar + pagination + empty helpers (Task 3) |
| `src/components/admin/confirm-action.tsx` (create) | Native-dialog confirm wrapper (Task 3) |
| `src/components/admin/form-drawer.tsx` (create) | Native-dialog side drawer for quick create (Task 3) |
| `src/components/admin/__tests__/admin-primitives.test.tsx` (create) | renderToString tests for Task 3 |
| `src/contexts/booking/kernel.ts` (modify: add export) | `tehranDayBounds` pure helper (Task 4) |
| `src/contexts/booking/queries.ts` (modify: add export) | `todaysBookings` cached query (Task 4) |
| `src/contexts/booking/__tests__/tehran-day.test.ts` (create) | Unit test for Task 4 |
| `src/app/[locale]/admin/page.tsx` (rewrite) | Queue-first dashboard (Task 4) |
| `src/app/[locale]/admin/diet-programs/claims/page.tsx` (modify) | Status tabs + header + confirm (Task 5) |
| `src/app/[locale]/admin/diet-programs/page.tsx` (modify) | Link to claims queue (Task 5) |
| `src/app/[locale]/admin/support/page.tsx` (modify) | Status tabs, all statuses visible (Task 6) |
| `src/app/[locale]/admin/providers/page.tsx`, `providers/[id]/page.tsx` (modify) | Search/filter/paginate + headers (Task 7) |
| `src/app/[locale]/admin/services/page.tsx`, `services/[id]/page.tsx` (modify) | Search + provider filter + paginate + headers (Task 7) |
| `src/app/[locale]/admin/categories/page.tsx`, `locations/page.tsx`, `topics/page.tsx` (modify) | Table parts + drawer create + headers (Task 8) |
| `src/app/[locale]/admin/foods/page.tsx`, `foods/[id]/page.tsx` (modify) | Search/paginate + missing create form (Task 8) |
| `src/app/[locale]/admin/content/page.tsx` (modify) | Kind/status/search/paginate (Task 8) |
| `src/app/[locale]/admin/scheduling/page.tsx` (rewrite) | Date-grouped slot board (Task 8) |
| `src/app/[locale]/admin/settings/page.tsx` (modify) | PageHeader only (Task 8) |
| `e2e/admin-command-center.spec.ts` (create) | Admin journey test (Task 9) |
| `messages/{fa,en,ar}.json` (modify) | Nav groups, claims item, shell + dashboard strings (Tasks 2, 4) |

---

### Task 1: List-params helper (pure, TDD)

**Files:**
- Create: `src/components/admin/list-params.ts`
- Test: `src/components/admin/__tests__/list-params.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseListParams(sp, opts)`, `paginate(rows, page, pageSize)`, `PAGE_SIZE` — used by Tasks 5–8.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseListParams, paginate, PAGE_SIZE } from "../list-params";

describe("parseListParams", () => {
  const tabs = ["all", "open", "closed"] as const;
  it("normalizes q, page, and a known tab", () => {
    expect(parseListParams({ q: "  Ali ", page: "2", tab: "open" }, { tabs, defaultTab: "all" }))
      .toEqual({ q: "ali", page: 2, tab: "open" });
  });
  it("falls back to defaults on garbage", () => {
    expect(parseListParams({ page: "abc", tab: "nope" }, { tabs, defaultTab: "all" }))
      .toEqual({ q: "", page: 1, tab: "all" });
  });
  it("clamps page minimum to 1 and reads first array value", () => {
    expect(parseListParams({ page: ["-3"] }, { tabs, defaultTab: "all" }).page).toBe(1);
  });
});

describe("paginate", () => {
  it("slices the requested page and reports totals", () => {
    const rows = Array.from({ length: 45 }, (_, i) => i);
    expect(paginate(rows, 2, 20)).toEqual({ items: rows.slice(20, 40), totalPages: 3, total: 45 });
  });
  it("defaults to PAGE_SIZE of 20", () => {
    expect(PAGE_SIZE).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/components/admin/__tests__/list-params.test.ts`
Expected: FAIL with "Cannot find module '../list-params'".

- [ ] **Step 3: Write minimal implementation**

```ts
export interface ListParams {
  q: string;
  page: number;
  tab: string;
}

export const PAGE_SIZE = 20;

const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export function parseListParams(
  sp: Record<string, string | string[] | undefined>,
  opts: { tabs: readonly string[]; defaultTab: string },
): ListParams {
  const rawTab = first(sp.tab ?? sp.status);
  return {
    q: first(sp.q).trim().toLowerCase(),
    page: Math.max(1, Number.parseInt(first(sp.page), 10) || 1),
    tab: opts.tabs.includes(rawTab) ? rawTab : opts.defaultTab,
  };
}

export function paginate<T>(rows: T[], page: number, pageSize: number = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safe = Math.min(page, totalPages);
  return { items: rows.slice((safe - 1) * pageSize, safe * pageSize), totalPages, total: rows.length };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/components/admin/__tests__/list-params.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/list-params.ts src/components/admin/__tests__/list-params.test.ts
git commit -m "feat(admin): add list param parsing and pagination helper"
```

---

### Task 2: Grouped shell, badges, drawer, PageHeader

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/[locale]/admin/layout.tsx`
- Create: `src/components/admin/admin-page-header.tsx`
- Test: `src/components/admin/__tests__/admin-chrome.test.tsx`
- Modify: `messages/fa.json`, `messages/en.json`, `messages/ar.json` (`admin.nav`, `admin.shell`)

**Interfaces:**
- Consumes: `allClaims` from `@/contexts/nutrition/queries`, `listRequests` from `@/contexts/support/queries`, `signOut` from `@/lib/auth-client`.
- Produces: `AdminShell` prop `badges?: { claims?: number; support?: number }`; `AdminPageHeader({crumbs, title, subtitle, action})` for Tasks 4–8; nav keys `admin.nav.claims`, `admin.nav.groups.{operations,catalog,knowledge,system}`, `admin.shell.signOut`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AdminShell } from "../admin-shell";
import { AdminPageHeader } from "../admin-page-header";

vi.mock("next/navigation", () => ({ usePathname: () => "/fa/admin/diet-programs/claims" }));
vi.mock("next-intl", () => ({
  useLocale: () => "fa",
  useTranslations: () => (key: string) => key,
}));

describe("AdminShell IA", () => {
  it("links the claims queue and marks it active", () => {
    const html = renderToString(<AdminShell locale="fa" badges={{ claims: 3, support: 1 }}>x</AdminShell>);
    expect(html).toContain("/fa/admin/diet-programs/claims");
    expect(html).toContain("bg-primary text-on-primary");
    expect(html).toContain(">3<");
  });
  it("does not mark diet-programs active on the claims route", () => {
    const html = renderToString(<AdminShell locale="fa">x</AdminShell>);
    const claimsIdx = html.indexOf("/fa/admin/diet-programs/claims");
    const programsIdx = html.indexOf('href="/fa/admin/diet-programs"');
    expect(claimsIdx).toBeGreaterThan(-1);
    expect(programsIdx).toBeGreaterThan(-1);
    const programsActive = html.slice(programsIdx, programsIdx + 400).includes("bg-primary text-on-primary");
    expect(programsActive).toBe(false);
  });
});

describe("AdminPageHeader", () => {
  it("renders breadcrumb trail back to the parent list", () => {
    const html = renderToString(
      <AdminPageHeader
        crumbs={[{ label: "داشبورد", href: "/fa/admin" }, { label: "پشتیبانی" }]}
        title="پشتیبانی"
      />,
    );
    expect(html).toContain('href="/fa/admin"');
    expect(html).toContain("پشتیبانی");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/components/admin/__tests__/admin-chrome.test.tsx`
Expected: FAIL — `badges` prop type error and `/fa/admin/diet-programs/claims` missing.

- [ ] **Step 3: Add message keys** — in each of `messages/fa.json`, `en.json`, `ar.json` under `admin.nav` add `"claims"`, and add a `groups` object with the four section labels; under `admin.shell` add `"signOut"`. fa values: claims «صف درخواست‌های رژیم», groups operations «عملیات», catalog «کاتالوگ», knowledge «دانش», system «سامانه», signOut «خروج». en/ar mirror the existing tone of that block.

- [ ] **Step 4: Implement shell + header.** In `admin-shell.tsx`: replace `ADMIN_NAV_ITEMS` with grouped sections (Operations: dashboard, claims with `badge: "claims"`, support with `badge: "support"`, scheduling; Catalog: providers, services, categories, locations; Knowledge: content, topics, foods, dietPrograms; System: settings), render group labels, longest-href-wins active state so `/admin/diet-programs/claims` does not light up `/admin/diet-programs`, badge pills from the `badges` prop, mobile drawer (`useState`, hamburger in topbar `md:hidden`, aside `hidden md:flex` plus fixed overlay when open), and a sign-out button calling `signOut()` from `@/lib/auth-client` then `window.location.assign(prefix)` (same pattern as `clinical-header.tsx:190`). In `layout.tsx`: `Promise.all([allClaims(), listRequests({ status: "open" })])` and pass `badges={{ claims: needsReviewCount, support: openRows.length }}` with a `ponytail:` ceiling comment (layout refetch per page; move to cached counts when admin traffic grows). Create `admin-page-header.tsx`: native-`Link` breadcrumb `ol`, `h1` title, optional subtitle, optional `action` node.

- [ ] **Step 5: Run test to verify it passes**

Run: `bunx vitest run src/components/admin/__tests__/admin-chrome.test.tsx`
Expected: PASS (3 tests). Then `bunx tsc --noEmit` must be 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/admin-shell.tsx src/components/admin/admin-page-header.tsx "src/app/[locale]/admin/layout.tsx" src/components/admin/__tests__/admin-chrome.test.tsx messages/fa.json messages/en.json messages/ar.json
git commit -m "feat(admin): grouped shell nav with claims queue, badges, drawer, page header"
```

---

### Task 3: Shared table, confirm, and drawer primitives

**Files:**
- Create: `src/components/admin/admin-table.tsx`
- Create: `src/components/admin/confirm-action.tsx`
- Create: `src/components/admin/form-drawer.tsx`
- Test: `src/components/admin/__tests__/admin-primitives.test.tsx`

**Interfaces:**
- Consumes: `EmptyState` from `@/components/clinical/empty-state`, `PendingSubmit`, `PendingLink`, `PendingAdminButton`.
- Produces: `AdminToolbar`, `AdminPagination`, `AdminEmpty`, `ConfirmAction`, `FormDrawer` for Tasks 5–8.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { AdminToolbar, AdminPagination, AdminEmpty } from "../admin-table";
import { ConfirmAction } from "../confirm-action";
import { FormDrawer } from "../form-drawer";

describe("admin primitives", () => {
  it("toolbar keeps the current query and submits via GET", () => {
    const html = renderToString(<AdminToolbar placeholder="جستجو" searchLabel="فیلتر" currentQ="ali" />);
    expect(html).toContain('name="q"');
    expect(html).toContain('value="ali"');
  });
  it("pagination links prev and next pages", () => {
    const html = renderToString(
      <AdminPagination page={2} totalPages={3} hrefFor={(p) => `/fa/admin/support?page=${p}`} />,
    );
    expect(html).toContain("page=1");
    expect(html).toContain("page=3");
  });
  it("confirm renders a dialog with the server form inside", () => {
    const html = renderToString(
      <ConfirmAction openLabel="لغو" title="تأیید لغو" message="مطمئنی؟" confirmSlot={<button type="submit">بله</button>} cancelLabel="انصراف" />,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain("تأیید لغو");
  });
  it("drawer renders a side panel with the create form inside", () => {
    const html = renderToString(
      <FormDrawer openLabel="جدید" title="دسته جدید" closeLabel="بستن"><form /></FormDrawer>,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain("دسته جدید");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/components/admin/__tests__/admin-primitives.test.tsx`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write minimal implementation** — `admin-table.tsx` (server components): `AdminToolbar` = GET form with `Input name="q" defaultValue={currentQ}` + `PendingSubmit`; `AdminPagination` = prev/next `PendingLink` via `hrefFor` with `busyLabel`, hidden on one page; `AdminEmpty` wraps `EmptyState`. `confirm-action.tsx` (`"use client"`): `useRef<HTMLDialogElement>`, trigger button opens via `showModal()`, `<dialog>` with title/message/`confirmSlot` (server-action form passed as prop from the server page) + `method="dialog"` cancel form. `form-drawer.tsx`: same dialog pattern with side-panel positioning classes and backdrop-click close (`e.target === dialog` → `close()`), `children` is the server create form.

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/components/admin/__tests__/admin-primitives.test.tsx`
Expected: PASS (4 tests). Then `bunx tsc --noEmit` must be 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/admin-table.tsx src/components/admin/confirm-action.tsx src/components/admin/form-drawer.tsx src/components/admin/__tests__/admin-primitives.test.tsx
git commit -m "feat(admin): shared table toolbar, pagination, confirm dialog, form drawer"
```

---

### Task 4: Queue-first dashboard + today's bookings

**Files:**
- Modify: `src/contexts/booking/kernel.ts` (add `tehranDayBounds`)
- Modify: `src/contexts/booking/queries.ts` (add `todaysBookings`)
- Test: `src/contexts/booking/__tests__/tehran-day.test.ts`
- Modify: `src/app/[locale]/admin/page.tsx` (rewrite)
- Modify: `messages/{fa,en,ar}.json` (`admin.overview` queue keys)

**Interfaces:**
- Consumes: `allClaims`, `listRequests`, `PendingLink`, `tehranDayBounds`.
- Produces: dashboard queue cards with `data-testid="queue-needs-review|queue-failed|queue-support|queue-today"` consumed by Task 9.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { tehranDayBounds } from "../kernel";

describe("tehranDayBounds", () => {
  it("pins a Jalali-day window to Asia/Tehran midnight", () => {
    const { start, end } = tehranDayBounds(new Date("2026-09-10T08:00:00Z"));
    expect(start.toISOString()).toBe("2026-09-09T20:30:00.000Z");
    expect(end.toISOString()).toBe("2026-09-10T20:30:00.000Z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/contexts/booking/__tests__/tehran-day.test.ts`
Expected: FAIL with "tehranDayBounds is not a function".

- [ ] **Step 3: Write helper + query.** In `booking/kernel.ts` add:

```ts
// Iran fixed UTC+3:30 since Sep 2022 (no DST) — revisit if the law changes.
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;

export function tehranDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now).split("-").map(Number);
  const start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]) - TEHRAN_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}
```

In `booking/queries.ts` add cached `todaysBookings` mirroring `myAppointments` fields plus provider name, with `.where(and(gte(availabilitySlots.startsAt, start), lt(availabilitySlots.startsAt, end)))`, ordered by `startsAt`, limit 50.

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/contexts/booking/__tests__/tehran-day.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite dashboard.** `Promise.all([allClaims(), listRequests({ status: "open" }), todaysBookings(), users/providers/services/appointments/contents counts])`; derive needs-review + failed lists with oldest-waiting age; four `PendingLink` queue cards with the testids above; honest metrics strip (providers, services, appointments, content only — drop users/translations cards); quick actions (new provider, new service, new content, scheduling). Add `admin.overview.queue.*` keys in all three locales.

- [ ] **Step 6: Verify and commit**

Run: `bunx tsc --noEmit` (0) and `bun run lint` (0).
```bash
git add src/contexts/booking/kernel.ts src/contexts/booking/queries.ts src/contexts/booking/__tests__/tehran-day.test.ts "src/app/[locale]/admin/page.tsx" messages/fa.json messages/en.json messages/ar.json
git commit -m "feat(admin): queue-first dashboard with todays bookings"
```

---

### Task 5: Claims queue tabs + diet-program link

**Files:**
- Modify: `src/app/[locale]/admin/diet-programs/claims/page.tsx`
- Modify: `src/app/[locale]/admin/diet-programs/page.tsx`

**Interfaces:**
- Consumes: `parseListParams`, `paginate`, `AdminToolbar`, `AdminPagination`, `ConfirmAction`, `AdminPageHeader`, existing claim actions (`approveClaim`, `forceRegenerate`, `requestClaimChanges`, `saveDocumentBody`, `cancelClaim`), `ClaimPoller`, `ClaimModal`, `STATUS_STYLES`.
- Produces: `?status=` tab links consumed by dashboard deep links from Task 4.

- [ ] **Step 1: Convert claims list to tabs.** `searchParams` → `parseListParams(sp, { tabs: ["all","pending","paid","generating","needs_review","ready","failed"], defaultTab: "needs_review" })`; counts per status from the single `allClaims()` result; tab bar as `PendingLink` list with counts; rows filtered in-page (`tab === "all"` keeps all) with a `ponytail:` ceiling comment (move to DB filter past 200 claims); `AdminPageHeader` crumbs dashboard → diet-programs → claims; keep `ClaimPoller`, `ClaimModal`, error `details`, and all action forms; wrap only the `cancelClaim` form in `ConfirmAction`.

- [ ] **Step 2: Link diet-programs to its queue.** Add `AdminPageHeader` plus a `PendingLink` to `${prefix}/admin/diet-programs/claims?status=needs_review` above the programs table.

- [ ] **Step 3: Verify and commit**

Run: `bunx tsc --noEmit` (0), `bun run lint` (0).
```bash
git add "src/app/[locale]/admin/diet-programs/claims/page.tsx" "src/app/[locale]/admin/diet-programs/page.tsx"
git commit -m "feat(admin): claims status tabs and program-to-queue link"
```

---

### Task 6: Support status tabs

**Files:**
- Modify: `src/app/[locale]/admin/support/page.tsx`

**Interfaces:**
- Consumes: `listRequests()` (unfiltered), `parseListParams`, `AdminToolbar`, `AdminPagination`, `AdminPageHeader`, `updateRequestStatus`, `STATUS_OPTIONS`.

- [ ] **Step 1: Convert support list to tabs.** One `listRequests()` call (limit 100); `parseListParams(sp, { tabs: ["all","open","in_progress","resolved","closed"], defaultTab: "open" })`; tab bar with per-status counts via `PendingLink`; `q` matches subject/body/userId; `paginate` the filtered rows; `AdminPageHeader` crumbs dashboard → support; keep the per-row status form calling `updateRequestStatus(r.id, fd)` unchanged.

- [ ] **Step 2: Verify and commit**

Run: `bunx tsc --noEmit` (0), `bun run lint` (0).
```bash
git add "src/app/[locale]/admin/support/page.tsx"
git commit -m "feat(admin): support status tabs with full history"
```

---

### Task 7: Catalog lists + detail headers

**Files:**
- Modify: `src/app/[locale]/admin/providers/page.tsx`, `providers/[id]/page.tsx`
- Modify: `src/app/[locale]/admin/services/page.tsx`, `services/[id]/page.tsx`

**Interfaces:**
- Consumes: primitives from Tasks 1–3; existing `ProviderForm`, `ServiceForm`, provider tab components.

- [ ] **Step 1: Providers list.** `q` over lowercased name/phone plus `kind` select (`all/person/organization`, default `all`) in the GET filter form with `PendingSubmit`; `paginate` results; `AdminPageHeader` with the existing New button as `action`; keep row links to `[id]`.

- [ ] **Step 2: Services list.** Keep the `serviceType` select, add `q` (name/provider) and `provider` select (all provider ids from the existing provider query); filter + `paginate`; `AdminPageHeader` with New action.

- [ ] **Step 3: Detail headers.** Both `[id]` pages (including the `id === "new"` branch) get `AdminPageHeader` with crumb back to their list; keep tab nav and forms untouched.

- [ ] **Step 4: Verify and commit**

Run: `bunx tsc --noEmit` (0), `bun run lint` (0).
```bash
git add "src/app/[locale]/admin/providers/page.tsx" "src/app/[locale]/admin/providers/[id]/page.tsx" "src/app/[locale]/admin/services/page.tsx" "src/app/[locale]/admin/services/[id]/page.tsx"
git commit -m "feat(admin): catalog search, filters, pagination, detail headers"
```

---

### Task 8: Knowledge sections, scheduling board, settings header

**Files:**
- Modify: `categories/page.tsx`, `locations/page.tsx`, `topics/page.tsx` (+ reuse `category-form.tsx`, `location-form.tsx`, inline topic inputs)
- Modify: `foods/page.tsx`, `foods/[id]/page.tsx`
- Modify: `content/page.tsx`
- Modify: `scheduling/page.tsx` (rewrite)
- Modify: `settings/page.tsx`

**Interfaces:**
- Consumes: primitives from Tasks 1–3; `createCategory`, `createLocation`, `saveTopic`, `saveFood` (upsert by id), existing content/food queries. No new delete actions: only actions already exported from `contexts/*/actions.ts` get confirm wrappers.

- [ ] **Step 1: Categories/locations/topics.** Each list: `AdminToolbar` + `paginate` + `AdminPageHeader` with `FormDrawer` create action reusing the existing form component/action (`CategoryForm`+`createCategory`, `LocationForm`+`createLocation`, topic name/slug inputs+`saveTopic`); keep row edit links; wrap only pre-existing destructive forms (if any) in `ConfirmAction` — do not invent deletes.

- [ ] **Step 2: Foods create.** List: `AdminToolbar` + `paginate` + header New button to `${prefix}/admin/foods/new`. Detail: `id === "new"` branch rendering the same name/category form plus hidden `id` with `crypto.randomUUID()` (server component, no client needed) posting to existing `saveFood` upsert; edit branch unchanged.

- [ ] **Step 3: Content filters + scheduling board + settings.** Content: `kind` + `status` selects plus `q` plus `paginate`, labels via existing `kinds.*`/`statuses.*` keys. Scheduling: `?date=` (default today ISO) with day bounds computed like the providers-slots tab, one `availabilitySlots` query joined to providers for that day, grouped by provider in-page, each row linking to `/admin/providers/{id}?tab=slots&date={date}` with booked/capacity counts. Settings: `AdminPageHeader` only, table untouched.

- [ ] **Step 4: Verify and commit**

Run: `bunx tsc --noEmit` (0), `bun run lint` (0).
```bash
git add "src/app/[locale]/admin/categories/page.tsx" "src/app/[locale]/admin/locations/page.tsx" "src/app/[locale]/admin/topics/page.tsx" "src/app/[locale]/admin/foods/page.tsx" "src/app/[locale]/admin/foods/[id]/page.tsx" "src/app/[locale]/admin/content/page.tsx" "src/app/[locale]/admin/scheduling/page.tsx" "src/app/[locale]/admin/settings/page.tsx"
git commit -m "feat(admin): knowledge tables, foods create, scheduling board"
```

---

### Task 9: Verification + admin journey test

**Files:**
- Create: `e2e/admin-command-center.spec.ts`

**Interfaces:**
- Consumes: testids from Task 4, tab params from Tasks 5–6. Mirror the login helper from existing `e2e/*.spec.ts` (read the journeys spec first for the `makeSignature` cookie pattern).

- [ ] **Step 1: Write the journey spec**

```ts
import { test, expect } from "@playwright/test";
// Mirror the admin login helper from e2e/journeys spec (makeSignature cookie).

test("admin triages queues from the dashboard", async ({ page }) => {
  await page.goto("/fa/admin");
  await expect(page.getByTestId("queue-needs-review")).toBeVisible();
  await page.getByTestId("queue-needs-review").click();
  await expect(page).toHaveURL(/claims\?status=needs_review/);
});

test("support history shows non-open tickets", async ({ page }) => {
  await page.goto("/fa/admin/support?status=all");
  await expect(page.getByRole("heading", { name: /پشتیبانی/ })).toBeVisible();
});
```

- [ ] **Step 2: Run full verification** — `docker compose up -d`, `bun run db:migrate`, all `db:seed*`, then `bunx tsc --noEmit` (0), `bun run lint` (0), `bun run test` (unit green), `bun run build` (all admin routes build), `bunx playwright test e2e/admin-command-center.spec.ts` (2 tests pass).

- [ ] **Step 3: Commit**

```bash
git add e2e/admin-command-center.spec.ts
git commit -m "test(admin): command-center dashboard and queue journey"
```

---

## Self-review

- Spec coverage: shell/IA (T2), dashboard queue (T4), 4 primitives (T3), claims tabs+link (T5), support tabs (T6), catalog (T7), knowledge/scheduling/settings (T8), testing/rollout (T9). No spec section left without a task.
- Placeholders: none — every step names exact files, params, and code. Deletes explicitly excluded where no action exists.
- Type consistency: `badges` prop (T2) matches layout usage; `hrefFor`/`confirmSlot`/`currentQ` prop names identical between test and implementation steps; `tehranDayBounds` return shape matches query usage.
