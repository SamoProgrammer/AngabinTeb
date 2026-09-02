# Angabin Teb — Purge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete every subsystem outside the manager's vision (appointment payments, home-care serviceability, ambulance dispatch, provider portal, support assignment) leaving a plain bookable-services + nutrition + content platform.

**Architecture:** Deletions only. Each task removes one subsystem's files, strips its kernel/schema branches, drops its columns/tables via a new migration, and leaves the booking concurrency guard and seeded plain services intact. No new features.

**Tech Stack:** Next 16.3.3, TS 7.0.2 (oxlint only), Tailwind v4, drizzle 0.45.x (postgres.js `.count`), better-auth 1.7.2, next-intl 4, Node 26.7, Postgres 17, bun.

**Spec:** `docs/superpowers/specs/2026-09-02-angabin-teb-purge-design.md` (the purge design, argues from `2026-08-31-angabin-teb-design.md` + manager message 2026-09-02)

**Predecessor:** `docs/superpowers/plans/2026-08-31-angabin-teb-phase-4-extended-care.md` (Phase 4 at d4f69fd)

## Global Constraints

1. Package manager: bun. `bun add` / `bun run` / `bunx`. Never pnpm/npm/yarn.
2. Next 16.3.x, TS 7.0.2 (NO typescript-eslint — oxlint only), Tailwind v4, drizzle 0.45.x (postgres.js — `.count` NOT `.rowCount`), better-auth 1.7.2 (usePlural, role additionalFields), next-intl 4.
3. `bunx tsc --noEmit` + `bun run lint` must exit 0 after every task. No docker/build/playwright runs during implementation (human owns verification, R10).
4. New columns/tables dropped via schema edit + `bun run db:generate` (no `db:migrate` — human runs it). Keep migration chain linear (0010, 0011...).
5. Booking concurrency guard (`UPDATE ... booked_count+partySize<=capacity` + `slotRes.count`) is sacred — no task touches it.
6. Persian strings stay UTF-8 literals; no i18n scope in this plan.

## File Map

```
delete:  src/lib/payments.ts
delete:  src/contexts/booking/payment-actions.ts
delete:  src/contexts/booking/__tests__/payment.test.ts
delete:  src/app/[locale]/(booking)/pay/**                    # pay/page.tsx + pay/return/page.tsx
delete:  src/contexts/booking/address.ts
delete:  src/contexts/booking/__tests__/address.test.ts
delete:  src/contexts/booking/ambulance.ts
delete:  src/contexts/booking/__tests__/ambulance.test.ts
delete:  src/db/schema/ambulance.ts                            # dispatch_record table (migration drops it)
delete:  src/app/[locale]/(marketing)/ambulance/**            # info page
delete:  src/app/[locale]/provider/** + provider-claim/**
delete:  e2e/extended.spec.ts                                  # its fixtures are gone; journeys/knowledge/nutrition stay
modify:  src/contexts/booking/kernel.ts                        # BookingStatus, canCancel, drop nextPaymentState
modify:  src/contexts/booking/actions.ts                       # cancel inArray→eq(confirmed), drop payment pending branch, drop home-care branch, drop dispatch insert, drop try/catch added for payments
modify:  src/db/schema/booking.ts                              # drop home_city_id/home_address_line comment, status comment
modify:  src/db/schema/catalog.ts                              # keep homeCareServices/ambulanceServices table defs, no behavior
modify:  src/db/schema/support.ts                              # drop assignee_user_id
modify:  src/db/schema/index.ts                                # drop ambulance export
modify:  src/contexts/catalog/queries.ts                       # drop homeCareInfo, listMyServices/listMySlots, serviceType param
modify:  src/contexts/catalog/actions.ts                       # drop updateMyService/generateMySlots/deactivateSlot
modify:  src/contexts/identity/actions.ts                      # drop requireProvider
modify:  src/contexts/support/actions.ts + queries.ts          # drop assignRequest/updateRequestPriority/listAdminUsers, listRequests priority param
modify:  src/components/booking/slot-picker.tsx                # drop homeCare prop + address step + not_serviceable/try-catch added
modify:  src/app/[locale]/(booking)/services/[slug]/book/page.tsx  # drop homeCareInfo wiring
modify:  src/app/[locale]/(discovery)/services/page.tsx        # drop serviceType searchParam passthrough
modify:  src/app/api-test/login/route.ts                       # drop ?role=provider branch
modify:  src/app/api-test/setup/route.ts                       # drop slot-home-test-1 reinsert
modify:  scripts/seed.ts                                        # drop svc-home-1/svc-amb-1/prov-portal-1 + admin-seed-2
modify:  messages/{fa,en,ar}.json                               # drop ambulance.* keys
modify:  OPEN_QUESTIONS.md                                      # trim to retained scope + keep reschedule note
```

---

### Task 1: Purge appointment online payments

**Files:**
- Delete: `src/lib/payments.ts`, `src/contexts/booking/payment-actions.ts`, `src/contexts/booking/__tests__/payment.test.ts`, `src/app/[locale]/(booking)/pay/page.tsx`, `src/app/[locale]/(booking)/pay/return/page.tsx`
- Modify: `src/contexts/booking/kernel.ts`, `src/contexts/booking/actions.ts`, `src/db/schema/booking.ts`

**Interfaces:**
- Consumes: nothing — deletions only.
- Produces: `BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show"` again; `canCancel(status)` = `status==="confirmed"` only; `bookAppointment` inserts `status:"confirmed"` unconditionally.

- [ ] **Step 1: Delete payment files**

Remove the 5 files above. If a directory becomes empty, leave it (git ignores empty dirs).

- [ ] **Step 2: Strip kernel to pre-payments**

`src/contexts/booking/kernel.ts` — revert to:
```ts
export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export function canCancel(status: BookingStatus): boolean {
  return status === "confirmed";
}
```
Delete the `pending` member, `nextPaymentState` function, and its `BookingStatus` import widening. Keep `holdExpired`, `canBook`, `reschedulePlan`, `validatePartySize` untouched.

- [ ] **Step 3: Strip booking actions**

`src/contexts/booking/actions.ts`:
- Imports: drop `inArray` if only used for the pending widening; restore `eq` alone on that line. Drop `dispatchRecords`/`initialDispatchStatus` are not this task — keep. Drop `nextPaymentState` import (gone).
- `cancelAppointment` — change `inArray(appointments.status, ["confirmed","pending"])` back to `eq(appointments.status, "confirmed")`.
- `bookAppointmentWithUser` — delete the `status: process.env.PAYMENT_GATEWAY && Number(svc.basePrice)>0 ? "pending" : "confirmed"` ternary; restore insert `status` omitted (defaults to "confirmed" via schema) or explicit `"confirmed"`. Delete the `Number()` guard.
- No other branches touched.

- [ ] **Step 4: Schema comment**

`src/db/schema/booking.ts` — appointment `status` comment reverts to `// confirmed | cancelled | completed | no_show` (drop pending), `paymentStatus` comment to `// unpaid | paid_at_location | refunded` (drop pending/paid_online note). No column change — do NOT run `db:generate` for this task.

- [ ] **Step 5: Verify**

Run: `bunx tsc --noEmit` (expect exit 0) and `bun run lint` (only pre-existing no-await-in-loop warnings).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: purge appointment online payments (manager scope)"
```

---

### Task 2: Purge home-care serviceability

**Files:**
- Delete: `src/contexts/booking/address.ts`, `src/contexts/booking/__tests__/address.test.ts`
- Modify: `src/contexts/booking/actions.ts`, `src/db/schema/booking.ts`, `src/contexts/catalog/queries.ts`, `src/components/booking/slot-picker.tsx`, `src/app/[locale]/(booking)/services/[slug]/book/page.tsx`, `src/app/api-test/setup/route.ts`, `scripts/seed.ts`

**Interfaces:**
- Consumes: `homeCareServices` table definition stays (harmless, no behavior).
- Produces: `bookAppointment` no longer branches on `serviceType==="home_care"`; `appointments` loses `home_city_id`/`home_address_line`.

- [ ] **Step 1: Delete address module + tests**

Remove the 2 files.

- [ ] **Step 2: Drop columns + migration**

`src/db/schema/booking.ts` — delete the two columns:
```ts
// remove:
homeCityId: text("home_city_id"),
homeAddressLine: text("home_address_line"),
```
Run: `bun run db:generate` — expect migration `0010_*` dropping both columns.

- [ ] **Step 3: Strip booking actions**

`src/contexts/booking/actions.ts`:
- Imports: drop `homeCareServices`, `isServiceable`.
- `bookSchema` — delete `homeAddress` field and the `homeAddressSchema` const.
- Inside `bookAppointmentWithUser` tx — delete the entire `if (svc.serviceType==="home_care") { ... }` block (the pre-UPDATE branch).
- Insert values — delete `homeCityId`/`homeAddressLine`.

- [ ] **Step 4: Strip catalog query + slot-picker + book page**

`src/contexts/catalog/queries.ts` — delete `homeCareInfo` function.
`src/components/booking/slot-picker.tsx` — delete `homeCare` prop type, address City/Address UI block, `homeAddress` building, `not_serviceable`/`address_required` error branches, and the try/catch added for the short-address guard. Restore `confirm()` to the pre-Task-4.1 shape (serviceId/slotId/partySize/idempotencyKey only).
`src/app/[locale]/(booking)/services/[slug]/book/page.tsx` — delete `homeCareInfo` import/call and the `homeCare` prop passed to SlotPicker.

- [ ] **Step 5: Seed + setup**

`scripts/seed.ts` — delete the `svc-home-1` block (category `cat-home`, provider `prov-home-1`, `homeCareServices` row, `slot-home-test-1`). Keep `prov-heart-1`/`svc-ecg-1`/slot-test-1/2 untouched.
`src/app/api-test/setup/route.ts` — delete the `slot-home-test-1` DELETE + reinsert block.

- [ ] **Step 6: Verify**

`bunx tsc --noEmit` + `bun run lint`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: purge home-care serviceability (plain service)"
```

---

### Task 3: Purge ambulance dispatch subsystem

**Files:**
- Delete: `src/db/schema/ambulance.ts`, `src/contexts/booking/ambulance.ts`, `src/contexts/booking/__tests__/ambulance.test.ts`, `src/app/[locale]/(marketing)/ambulance/**`
- Modify: `src/db/schema/index.ts`, `src/contexts/booking/actions.ts`, `src/contexts/catalog/queries.ts`, `src/app/[locale]/(discovery)/services/page.tsx`, `messages/{fa,en,ar}.json`, `scripts/seed.ts`

**Interfaces:**
- Consumes: none.
- Produces: no `dispatch_record` table; no dispatch insert; ambulance remains a plain `service_type`.

- [ ] **Step 1: Delete files**

Remove the 4 file groups above.

- [ ] **Step 2: Drop table + migration**

`src/db/schema/index.ts` — delete `export * from "./ambulance"`.
Run: `bun run db:generate` — expect migration `0011_*` dropping `dispatch_record` table.

- [ ] **Step 3: Strip booking actions**

`src/contexts/booking/actions.ts` — delete the `if (svc.serviceType==="ambulance") { await tx.insert(dispatchRecords)... }` block and its `dispatchRecords`/`initialDispatchStatus` imports. Delete the `cancelAppointment` dispatch cancel line added in the final fix wave (`tx.update(dispatchRecords).set({status:"cancelled"})`).

- [ ] **Step 4: Strip catalog filter added for ambulance**

`src/contexts/catalog/queries.ts` — `listServices(locale, categoryId?, cityId?, serviceType?)` → `listServices(locale, categoryId?, cityId?)` (drop the 4th param and its `eq(services.serviceType, serviceType)` clause).
`src/app/[locale]/(discovery)/services/page.tsx` — `searchParams` loses `serviceType`, call reverts to `listServices(locale, category, city)`.

- [ ] **Step 5: Messages + seed**

`messages/{fa,en,ar}.json` — delete `ambulance.title`/`ambulance.body`/`ambulance.book` keys.
`scripts/seed.ts` — delete `svc-amb-1` block (`ambulanceServices` row + `slot-amb-test-1`).

- [ ] **Step 6: Verify**

`bunx tsc --noEmit` + `bun run lint`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: purge ambulance dispatch subsystem (plain service)"
```

---

### Task 4: Purge provider portal

**Files:**
- Delete: `src/app/[locale]/provider/**`, `src/app/[locale]/provider-claim/**`
- Modify: `src/contexts/identity/actions.ts`, `src/contexts/catalog/queries.ts`, `src/contexts/catalog/actions.ts`, `src/app/api-test/login/route.ts`, `scripts/seed.ts`

**Interfaces:**
- Consumes: none.
- Produces: no `requireProvider`; no scoped catalog actions; roles `patient/admin` only via existing `requireAdmin` path.

- [ ] **Step 1: Delete portal pages**

Remove both `provider` and `provider-claim` route groups entirely.

- [ ] **Step 2: Strip identity + catalog**

`src/contexts/identity/actions.ts` — delete `requireProvider` function and its `providers`/`eq`/`db` imports (keep `requireUser`/`requireAdmin`).
`src/contexts/catalog/queries.ts` — delete `listMyServices` + `listMySlots`.
`src/contexts/catalog/actions.ts` — delete `updateMyService` + `generateMySlots` (+ its local schema) + `deactivateSlot`. Keep `generateSlots` (admin) untouched.

- [ ] **Step 3: Strip e2e fixtures**

`src/app/api-test/login/route.ts` — delete the `?role=provider` branch (keep default test-patient block only; remove the `role` searchParam read and the `test-provider` upsert).
`scripts/seed.ts` — delete `prov-portal-1`/`loc-portal-1`/`svc-provider-1` block.

- [ ] **Step 4: Verify**

`bunx tsc --noEmit` + `bun run lint`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: purge provider portal (admin-only)"
```

---

### Task 5: Purge support assignment/priority actions

**Files:**
- Modify: `src/db/schema/support.ts`, `src/contexts/support/actions.ts`, `src/contexts/support/queries.ts`, `src/app/[locale]/admin/support/page.tsx`, `scripts/seed.ts`

**Interfaces:**
- Consumes: `support_request` with `status` only.
- Produces: `assignee_user_id` gone; queue shows status-only; `priority` column stays as stored data (no UI).

**Decision gate:** `priority` column existed pre-purge — keep it as a column (no migration) but remove the UI that manages it beyond display. `assignee_user_id` is new in Phase 4 — drop it.

- [ ] **Step 1: Drop column + migration**

`src/db/schema/support.ts` — delete `assigneeUserId: text("assignee_user_id").references(() => users.id),` line.
Run: `bun run db:generate` — expect migration `0012_*` dropping the column + FK. Keep `priority` column.

- [ ] **Step 2: Strip support actions/queries**

`src/contexts/support/actions.ts` — delete `assignRequest`, `updateRequestPriority`, and the `users` import added for the role check. Keep `updateRequestStatus` + `markNotificationsRead`.
`src/contexts/support/queries.ts` — delete `listAdminUsers`; revert `listRequests(status?, priority?)` → `listRequests(status?)` (single optional status, `where(eq(supportRequests.status, status))`).

- [ ] **Step 3: Strip queue page**

`src/app/[locale]/admin/support/page.tsx` — delete priority filter select (GET form), per-row assignee select + Assign button, per-row priority select + Set button, and the `assigneeUserId` display. Keep the status select + Update button. Call reverts to `listRequests("open")` (hardcoded, status-only). Keep `Badge` for `r.kind`/`r.priority` display (priority badge stays read-only).

- [ ] **Step 4: Seed**

`scripts/seed.ts` — delete `admin-seed-2` block. Keep `admin-seed` (single admin).

- [ ] **Step 5: Verify**

`bunx tsc --noEmit` + `bun run lint`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: purge support assignment/priority (status-only queue)"
```

---

### Task 6: Purge e2e + docs + final verification

**Files:**
- Delete: `e2e/extended.spec.ts`
- Modify: `OPEN_QUESTIONS.md`

**Interfaces:**
- Consumes: all prior purges.
- Produces: no extended.spec; OPEN_QUESTIONS trimmed to retained scope.

- [ ] **Step 1: Delete extended spec**

Remove `e2e/extended.spec.ts` (its fixtures are gone — home-care unserviceable city + provider schedule — and its assertions target deleted code).

- [ ] **Step 2: Trim OPEN_QUESTIONS**

`OPEN_QUESTIONS.md` — delete sections `Live tracking` (if you want to keep as deferred — manager didn't mention it, keep only if desired; recommended: keep as out-of-scope note, single line), `Emergency dispatch` (ambulance is now plain — remove), `Reschedule vs payment state` (payment system gone — remove or reword to "Reschedule UI deferred — no payment state involved"). Keep `Insurance handling`, `Calendar integrations`, `Refunds` (reword to "downloadable content refund policy, not appointment refund"), `No-show policy enforcement`. One sentence per remaining item.

- [ ] **Step 3: Verify**

`bunx tsc --noEmit` + `bun run lint` + `bun run build` (human-owned, but run as gate if you have the env — otherwise tsc+lint only and note build deferred).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: purge extended e2e + trim open questions to retained scope"
```

---

## Self-Review

- Spec coverage: P1–P5 purge items each have a dedicated task (1–5); Task 6 covers e2e/docs. No spec section left without a task.
- Placeholders: none — every step names exact files, exact code to delete/restore, and the commit message.
- Type consistency: `BookingStatus` reverts cleanly (no other file will reference `pending` after Task 1); `cancelAppointment` reverts to `eq(confirmed)` matching the restored kernel.
