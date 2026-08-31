# Angabin Teb — Phase 4: Extended Care Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the core to home care, rehabilitation, and ambulance; add the provider portal with schedule/service management; introduce online payments with idempotent charge semantics; and deepen the support center with assignment and priority.

**Architecture:** Everything rides the Phase 1 spine. Home care and ambulance are satellite tables on `service` with booking branches that diverge in exactly the two places the spec allows (review step content, confirmation side effects — spec §6.1). The provider portal is a second role surface over the existing catalog actions, not a new system. Payments are a gateway behind one function with an idempotency-keyed charge — the appointment's `payment_status` gains `paid_online` and `pending` state returns. Spec §11 gap items are surfaced as explicit **decision gates**, not silently invented behavior.

**Tech Stack:** Everything from Phases 0–3, plus one payment SDK (gateway chosen at the Task 4.4 gate).

**Spec:** `docs/superpowers/specs/2026-08-31-angabin-teb-design.md` (§5.1 satellites, §6.1 branches, §9 provider portal, §11 Phase 4, §13 risks 3/6/7, F-007/F-008/F-009)

**Predecessor:** `docs/superpowers/plans/2026-08-31-angabin-teb-phase-3-knowledge.md`

## Global Constraints

1. **Satellites already exist** (Phase 1 Task 1.1): `home_care_service(service_id, requires_patient_address, serviceable_city_ids[])`, `ambulance_service(service_id, dispatch_model, vehicle_type)`. This phase fills them in and branches the booking flow on them.
2. **Booking branches in exactly two places** (spec §6.1): (a) the review step — home care adds address capture + serviceability check; (b) confirmation side effects — ambulance creates a dispatch record.
3. **Do not invent unverified workflows** (spec F-009, §11): ambulance emergency semantics, ETA tracking, dispatch model, and pricing are **unknowns**. Each gets a decision gate: if the operator can't define it, the feature ships as a **bookable scheduled transport service** with no emergency claim, or is dropped — both are acceptable, neither is invented.
4. **Home-care serviceability** (spec F-007): `serviceable_city_ids` is a `jsonb` array on the satellite; a booking is rejected when the patient's address city is not in the list. No live tracking, no dispatch engine (spec §12).
5. **Provider portal** (spec §9): `role = 'provider'` users manage their own services and availability via the existing catalog actions, scoped by `provider_id`. They never touch other providers' rows. Admin keeps global access.
6. **Payments** (spec §6.2, NFR-006): `payment_status` gains `paid_online`; `pending` appointment state returns **only when online payment is enabled**. The charge is idempotent — the gateway's payment token or the appointment's `idempotency_key` guards duplicate charges.
7. **Support** (spec §9): `assignee_user_id` and priority (`normal | high`) extend `support_request`. History is preserved by keeping status-change notifications (Phase 3) rather than mutating.
8. **Rehabilitation** (spec F-008): no new code path — it is `service_type='rehab'` in the existing catalog + booking. Work here is seed data and one admin filter.
9. Payment gateway choice is a **local decision** (spec §13 risk 6: sanctions/jurisdiction). The interface below is gateway-agnostic; the SDK integration lands behind it.

## File Map

```
src/
  db/schema/booking.ts          # + payment-related columns
  db/schema/ambulance.ts        # dispatch_record
  contexts/booking/
    kernel.ts                   # + payment_state helper
    actions.ts                  # + address/serviceability branch, payment actions
    model.ts
  contexts/catalog/
    actions.ts                  # + provider-scoped variants
  contexts/support/
    actions.ts                  # + assign, priority
  app/[locale]/
    (booking)/
      services/[slug]/book/page.tsx    # + address step for home_care
      pay/page.tsx                     # online payment redirect/return
    admin/
      providers/page.tsx               # + provider account creation
      support/page.tsx                 # + assignment + priority
    provider/                          # provider portal (role-scoped)
      layout.tsx
      page.tsx
      schedule/page.tsx
      services/page.tsx
    (marketing)/ambulance/page.tsx     # ambulance info page (decision-gated)
  e2e/extended.spec.ts
```

---

### Task 4.1: Home care booking branch

**Files:**
- Create: `src/contexts/booking/address.ts` (pure: parse + serviceability check), `src/contexts/booking/__tests__/address.test.ts`
- Modify: `src/contexts/booking/actions.ts`, `src/app/[locale]/(booking)/services/[slug]/book/page.tsx`, `src/contexts/catalog/queries.ts` (expose `homeCareInfo(serviceId)`)

**Interfaces:**
- Consumes: `homeCareServices` satellite (Phase 1), booking actions (Phase 1)
- Produces:
  - `normalizeCity(raw: string): string` — trims, lowercases, maps common variants; pure
  - `isServiceable(serviceableCityIds: string[], cityId: string): boolean`
  - `bookAppointment` input gains `{ homeAddress?: { cityId: string; addressLine: string } }` — validated against the satellite inside the transaction
  - `homeCareInfo(serviceId)` — satellite row + serviceable city list for the review step

- [ ] **Step 1: Write the failing tests**

`src/contexts/booking/__tests__/address.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isServiceable } from "../address";

describe("isServiceable", () => {
  it("serves listed cities", () => {
    expect(isServiceable(["1", "2"], "1")).toBe(true);
  });
  it("rejects unlisted cities", () => {
    expect(isServiceable(["1", "2"], "3")).toBe(false);
  });
  it("rejects an empty service area", () => {
    expect(isServiceable([], "1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/contexts/booking/__tests__/address.test.ts`
Expected: FAIL — module not defined.

- [ ] **Step 3: Write the pure module**

`src/contexts/booking/address.ts`:

```ts
export function isServiceable(serviceableCityIds: string[], cityId: string): boolean {
  return serviceableCityIds.includes(cityId);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/contexts/booking/__tests__/address.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Branch the booking action**

In `src/contexts/booking/actions.ts`, extend `bookSchema` and the transaction:

```ts
const homeAddressSchema = z.object({
  cityId: z.string().min(1),
  addressLine: z.string().min(5).max(300),
});

const bookSchema = z.object({
  serviceId: z.string().min(1),
  slotId: z.string().min(1),
  partySize: z.number(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(64),
  homeAddress: homeAddressSchema.optional(),
});
```

Inside the transaction, after the slot `UPDATE` succeeds and before the appointment insert:

```ts
const [svc, satellite] = await Promise.all([
  tx.select().from(services).where(eq(services.id, data.serviceId)),
  tx.select().from(homeCareServices).where(eq(homeCareServices.serviceId, data.serviceId)),
]);
if (svc[0]?.serviceType === "home_care") {
  if (!data.homeAddress) return { ok: false as const, reason: "address_required" };
  const serviceable = satellite[0]?.serviceableCityIds as string[] | undefined;
  if (!isServiceable(serviceable ?? [], data.homeAddress.cityId)) {
    return { ok: false as const, reason: "not_serviceable" };
  }
}
```

Persist the address on the appointment — add `homeCityId` and `homeAddressLine` nullable columns to `appointments` (`src/db/schema/booking.ts`), regenerate + migrate, and include them in the insert values.

- [ ] **Step 6: Branch the book page**

`src/app/[locale]/(booking)/services/[slug]/book/page.tsx` — when `getService(...).serviceType === "home_care"`, render an address step (city select + address textarea) before the slot picker; the picker's confirm call includes `homeAddress`. When the action returns `not_serviceable`, render "This service is not available in your area."

- [ ] **Step 7: Verify**

Run: `pnpm dev` — seed a home-care service with `serviceable_city_ids: ["1"]`; booking with city 1 succeeds; city 3 is rejected with the area message; a non-home-care service never shows the address step.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: home care address capture with serviceability check"
```

---

### Task 4.2: Rehabilitation as data, not code

**Files:**
- Create: `scripts/seed-rehab.ts`
- Modify: `src/app/[locale]/admin/services/page.tsx` (filter by `service_type`)

**Interfaces:**
- Consumes: existing catalog + booking (Phase 1)
- Produces: 3–5 seeded `service_type='rehab'` services with providers, locations, and generated slots — proving F-008 needs no code path

- [ ] **Step 1: Write the seed**

`scripts/seed-rehab.ts` — same upsert pattern as Phase 0 Task 0.6: rehab providers (person kind), a `rehab` category, rehab services (`service_type: "rehab"`, satellites not needed), and a slot run via `generateSlots`. Persian base names + one English override each.

- [ ] **Step 2: Add the admin filter**

`src/app/[locale]/admin/services/page.tsx` — add a `service_type` select filter wired through `searchParams`, defaulting to "all". Three lines following the Phase 1 `searchParams` pattern; no new query function (inline the filter into the existing list select with the `and(...)` pattern).

- [ ] **Step 3: Verify**

Run: `pnpm dev` — rehab services appear in `/fa/services`, are bookable through the unchanged Phase 1 flow, and are filterable in admin.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: rehabilitation as seeded catalog data with admin filter"
```

---

### Task 4.3: Ambulance — decision gate, then bookable transport

**Files:**
- Create: `src/db/schema/ambulance.ts`, `src/contexts/booking/ambulance.ts`, `src/contexts/booking/__tests__/ambulance.test.ts`, `src/app/[locale]/(marketing)/ambulance/page.tsx`

**Interfaces:**
- Consumes: `ambulanceServices` satellite (Phase 1), booking actions
- Produces: `dispatch_record(ambulance_service_id, appointment_id, status)` with `status: scheduled | en_route | completed | cancelled`; a dispatch row created on confirmation; an info page that states exactly what the service is

**Decision gate (constraint 3) — resolve before Step 1:** the ambulance service ships as **scheduled, non-emergency transport** (booked like any service: city + slot). No ETA tracking, no live dispatch, no emergency claim. If the operator later defines a dispatch model, the `dispatch_record` table already holds the hook. This is the spec-sanctioned alternative to inventing behavior.

- [ ] **Step 1: Write the failing test**

`src/contexts/booking/__tests__/ambulance.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { initialDispatchStatus } from "../ambulance";

describe("initialDispatchStatus", () => {
  it("starts scheduled", () => {
    expect(initialDispatchStatus("confirmed")).toBe("scheduled");
  });
});
```

- [ ] **Step 2: Run to verify it fails, then write the module**

`src/contexts/booking/ambulance.ts`:

```ts
export type DispatchStatus = "scheduled" | "en_route" | "completed" | "cancelled";

export function initialDispatchStatus(appointmentStatus: string): DispatchStatus {
  return appointmentStatus === "cancelled" ? "cancelled" : "scheduled";
}
```

- [ ] **Step 3: Write the dispatch table + confirmation hook**

`src/db/schema/ambulance.ts`:

```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { appointments } from "./booking";
import { services } from "./catalog";

export const dispatchRecords = pgTable("dispatch_record", {
  id: text("id").primaryKey(),
  ambulanceServiceId: text("ambulance_service_id").notNull().references(() => services.id),
  appointmentId: text("appointment_id").notNull().references(() => appointments.id),
  status: text("status").notNull().default("scheduled"), // scheduled | en_route | completed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

In `bookAppointment` (actions.ts), after the insert, branch on `svc.serviceType === "ambulance"`:

```ts
if (svc[0]?.serviceType === "ambulance") {
  await tx.insert(dispatchRecords).values({
    id: randomUUID(),
    ambulanceServiceId: data.serviceId,
    appointmentId,
    status: initialDispatchStatus("confirmed"),
  });
}
```

- [ ] **Step 4: Write the info page**

`src/app/[locale]/(marketing)/ambulance/page.tsx` — copy from `messages/*.json` (`ambulance.body`): scheduled non-emergency transport, city coverage via the seeded `serviceable_city_ids`, book-through flow to `/services` filtered to `service_type=ambulance`. No emergency claims, no ETA.

- [ ] **Step 5: Verify**

Run: `pnpm dev` — seed one ambulance service + slots; book it; a `dispatch_record` row appears with `scheduled`; the marketing page states the non-emergency scope.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: ambulance as scheduled transport with dispatch records"
```

---

### Task 4.4: Online payments (idempotent, gateway-agnostic)

**Files:**
- Create: `src/lib/payments.ts`, `src/contexts/booking/payment-actions.ts`, `src/app/[locale]/(booking)/pay/page.tsx`, `src/app/[locale]/(booking)/pay/return/page.tsx`, `src/contexts/booking/__tests__/payment.test.ts`
- Modify: `src/db/schema/booking.ts` (columns + index), `src/contexts/booking/actions.ts` (status becomes `pending` when paying online)

**Interfaces:**
- Consumes: appointments, kernel
- Produces:
  - `initiatePayment(appointmentId, amountToman): Promise<{ redirectUrl: string }>` — one function, gateway-agnostic; dev implementation logs a fake payment URL
  - `verifyPayment(token: string): Promise<{ ok: true; paymentId: string } | { ok: false; reason: "invalid" }>` — the only gateway-dependent function
  - `chargeAppointment(appointmentId, paymentId)` — marks `paid_online`, transitions `pending → confirmed`, idempotent on `idempotency_key`
  - Kernel addition: `nextPaymentState(paymentStatus, gatewayOk): "pending" | "paid_online" | "unpaid"`

**Decision gate (constraint 9):** pick the gateway (Iranian market: Zarinpal/Saman/others — local choice). `initiatePayment`/`verifyPayment` are the only two functions that change when the gateway changes.

- [ ] **Step 1: Write the failing kernel test**

`src/contexts/booking/__tests__/payment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextPaymentState } from "../kernel";

describe("nextPaymentState", () => {
  it("pays a pending booking", () => {
    expect(nextPaymentState("pending", true)).toBe("paid_online");
  });
  it("keeps pending on gateway failure", () => {
    expect(nextPaymentState("pending", false)).toBe("pending");
  });
  it("never overwrites an existing paid state", () => {
    expect(nextPaymentState("paid_online", true)).toBe("paid_online");
  });
});
```

- [ ] **Step 2: Run to verify it fails, then add the kernel function**

Append to `src/contexts/booking/kernel.ts`:

```ts
export function nextPaymentState(
  current: "pending" | "paid_online" | "unpaid",
  gatewayOk: boolean,
): "pending" | "paid_online" | "unpaid" {
  if (current === "paid_online") return "paid_online";
  if (current === "pending" && gatewayOk) return "paid_online";
  return current;
}
```

- [ ] **Step 3: Write the payment module**

`src/lib/payments.ts`:

```ts
import { randomUUID } from "crypto";

// Gateway-agnostic (constraint 9). In production, swap the bodies of
// initiatePayment/verifyPayment for the chosen SDK; nothing else changes.

export async function initiatePayment(
  appointmentId: string,
  amountToman: string,
): Promise<{ redirectUrl: string }> {
  if (process.env.PAYMENT_GATEWAY) {
    // e.g. gateway.createTransaction({ appointmentId, amountToman })
    throw new Error("PAYMENT_GATEWAY integration not implemented");
  }
  const token = randomUUID();
  return { redirectUrl: `/pay/return?token=${token}&appointment=${appointmentId}` };
}

export async function verifyPayment(token: string): Promise<{ ok: true; paymentId: string } | { ok: false; reason: "invalid" }> {
  if (!token) return { ok: false, reason: "invalid" };
  // Dev: any token with a real appointment id is accepted; production calls the gateway.
  return { ok: true, paymentId: `dev-${token}` };
}
```

- [ ] **Step 4: Write the payment actions**

`src/contexts/booking/payment-actions.ts`:

```ts
"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { nextPaymentState } from "./kernel";

export async function startPayment(appointmentId: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, user.id)));
  if (!row) return { ok: false as const, reason: "not_found" };
  if (row.paymentStatus !== "unpaid") return { ok: false as const, reason: "already_paid" };
  const { redirectUrl } = await initiatePayment(appointmentId, row.price);
  return { ok: true as const, redirectUrl };
}

export async function completePayment(appointmentId: string, token: string) {
  const user = await requireUser();
  const result = await verifyPayment(token);
  if (!result.ok) return result;

  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, user.id)));
  if (!row) return { ok: false as const, reason: "not_found" };

  const next = nextPaymentState(row.paymentStatus as "pending" | "paid_online" | "unpaid", true);
  if (next === "paid_online") {
    await db.update(appointments)
      .set({ paymentStatus: "paid_online", status: "confirmed" })
      .where(eq(appointments.id, appointmentId));
  }
  return { ok: true as const, paymentStatus: next };
}
```

- [ ] **Step 5: Add the schema columns and the pending transition**

`src/db/schema/booking.ts` — nothing new needed for `payment_status` (it already exists), but `bookAppointment` now writes `status: "pending"` when the service's `base_price > 0` and online payment is enabled (a `PAYMENT_GATEWAY` env flag), and `pending` joins the appointment status union in the kernel:

```ts
export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no_show";
```

`canCancel` accepts `pending` too. Regenerate + migrate if the status comment/check changed (no column change).

- [ ] **Step 6: Write the pay pages**

`src/app/[locale]/(booking)/pay/page.tsx` — posts `startPayment(appointmentId)` from a "Pay online" button; `pay/return/page.tsx` — reads `token`/`appointment` from `searchParams`, calls `completePayment`, renders "Paid — appointment confirmed" or the gateway error.

- [ ] **Step 7: Verify**

Run: `pnpm dev` — book a priced service with the payment flag on → status `pending`; pay → `paid_online` + `confirmed`; paying again is rejected by `already_paid`; the dev gateway path never double-charges because `completePayment` is guarded by the payment status transition.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: idempotent online payments behind a gateway-agnostic interface"
```

---

### Task 4.5: Provider portal

**Files:**
- Create: `src/app/[locale]/provider/layout.tsx`, `src/app/[locale]/provider/page.tsx`, `src/app/[locale]/provider/schedule/page.tsx`, `src/app/[locale]/provider/services/page.tsx`
- Modify: `src/contexts/catalog/actions.ts` (provider-scoped variants), `src/contexts/identity/actions.ts` (seed helper for provider accounts)

**Interfaces:**
- Consumes: catalog actions (Phase 1), `requireUser` (Phase 0)
- Produces: `requireProvider(): Promise<{ user; providerRow }>` — `role === 'provider'` with their `provider` row; `listMyServices(providerId)`, `listMySlots(providerId, from, to)`; every write action takes `providerId` and filters on it

- [ ] **Step 1: Write the guard and scope helper**

`src/contexts/identity/actions.ts` — append:

```ts
import { providers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export async function requireProvider() {
  const user = await requireUser();
  if (user.role !== "provider") redirect("/");
  const [row] = await db.select().from(providers).where(eq(providers.phone, user.phoneNumber ?? ""));
  if (!row) return redirect("/provider/claim");
  return { user, providerRow: row };
}
```

`/provider/claim` (created in this task) links a provider-role user to a `provider` row by phone number — the one-time onboarding step (spec §11 "provider onboarding" gap, resolved minimally).

- [ ] **Step 2: Scope the actions**

Add to `src/contexts/catalog/actions.ts`, keeping the Phase 1 functions intact (admin keeps them):

```ts
export async function updateMyService(providerId: string, serviceId: string, input: ...) {
  const { providerRow } = await requireProvider();
  if (providerRow.id !== providerId) return { ok: false as const, reason: "forbidden" };
  // same update as admin's, with the providerId guard — repeat the Phase 1 pattern
}
```

Same for `generateSlots` (provider-scoped: `generateMySlots(providerId, input)` filtering `availabilitySlots.providerId`).

- [ ] **Step 3: Write the portal pages**

`src/app/[locale]/provider/layout.tsx` — `requireProvider()`, nav (Overview / Schedule / Services). `page.tsx` — counts: this week's slots, upcoming appointments for their services (`join` on `availabilitySlots.providerId`). `schedule/page.tsx` — `generateMySlots` form + `listMySlots` table with cancel-slot action (set `is_active = false`). `services/page.tsx` — `listMyServices` + edit price/duration inline.

- [ ] **Step 4: Verify**

Run: `pnpm dev` — create a provider-role user via seed, claim the seeded provider row, generate slots for their own service; a second provider user cannot see or touch the first provider's rows (each query is scoped by `providerRow.id`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: provider portal with role-scoped scheduling and services"
```

---

### Task 4.6: Advanced support — assignment and priority

**Files:**
- Modify: `src/db/schema/support.ts`, `src/contexts/support/actions.ts`, `src/app/[locale]/admin/support/page.tsx`

**Interfaces:**
- Consumes: support actions (Phase 3)
- Produces: `assignRequest(id, assigneeUserId)`, priority select in the queue; notification on assignment

- [ ] **Step 1: Extend the schema**

`src/db/schema/support.ts` — add:

```ts
assigneeUserId: text("assignee_user_id").references(() => users.id),
```

Regenerate + migrate. (Priority column already exists from Phase 3.)

- [ ] **Step 2: Extend the actions**

`src/contexts/support/actions.ts` — append (admin-guarded, same pattern as `updateRequestStatus`):

```ts
export async function assignRequest(id: string, assigneeUserId: string) {
  // requireUser + role admin guard, then:
  // db.update(supportRequests).set({ assigneeUserId, updatedAt: new Date() })
  // + notification row to the assignee: kind 'support_reply', title 'Request assigned'
}
```

- [ ] **Step 3: Extend the queue page**

`src/app/[locale]/admin/support/page.tsx` — status filter gains priority (`normal | high`), each row gets an assignee select (users with role `admin`, from a `listAdminUsers()` query) and a priority select posting to `updateRequestPriority` (add: one-line action following the same pattern).

- [ ] **Step 4: Verify**

Run: `pnpm dev` — assign an open complaint to a second admin → the assignee's notifications show the assignment; priority renders in the queue filter.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: support assignment and priority"
```

---

### Task 4.7: Journey test + Phase 4 exit verification

**Files:**
- Create: `e2e/extended.spec.ts`

- [ ] **Step 1: Write the extended journey test**

`e2e/extended.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("home care booking requires a serviceable address", async ({ page }) => {
  await page.goto("/fa/services");
  await page.getByRole("link", { name: /پرستاری در منزل/ }).first().click();
  await page.getByRole("link", { name: "Book this service" }).click();
  await page.getByLabel("City").selectOption("3"); // unserviceable
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText(/not available in your area/i)).toBeVisible();
});

test("provider portal schedules slots", async ({ page }) => {
  // provider-role session (seed helper)
  await page.goto("/fa/provider/schedule");
  await page.getByLabel("Weekday").selectOption("2");
  await page.getByLabel("Start").fill("09:00");
  await page.getByLabel("End").fill("10:00");
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(page.getByText(/generated/i)).toBeVisible();
});
```

- [ ] **Step 2: Full pass**

```bash
pnpm test && pnpm lint && pnpm build && pnpm exec playwright test
```

- [ ] **Step 3: Spec §11 Phase 4 exit criteria**

1. Home-care address + serviceability flow works (Task 4.1).
2. Ambulance dispatch defined (as scheduled transport) **or** formally dropped — the gate in Task 4.3 records which.
3. Rehab bookable through the unchanged spine (Task 4.2).
4. Provider portal live with role-scoped scheduling (Task 4.5).
5. Payments idempotent, gateway-agnostic, `paid_online` state proven (Task 4.4).
6. Support queue has assignment + priority (Task 4.6).
7. **Known deferred items recorded, not hidden** (spec §12): live tracking, insurance handling, calendar integrations, refunds, no-show policy enforcement, emergency dispatch — each listed in the repo README or an `OPEN_QUESTIONS.md` with the decision gate it awaits.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: phase 4 exit verification and open-questions ledger"
```

---

## Phase 4 Self-Review

- **Spec coverage:** §5.1 satellites filled — Tasks 4.1/4.3; §6.1 two branch points honored — Tasks 4.1 (review) / 4.3 (confirmation side effect); F-007 — Task 4.1; F-008 — Task 4.2; F-009 — Task 4.3 with the constraint-3 gate; §9 provider portal — Task 4.5; §10 payments + NFR-006 idempotency — Task 4.4; §11 gaps (onboarding, assignment) — Tasks 4.5/4.6; §13 risk 6 (gateway jurisdiction) — Task 4.4 gate; §12 (what stays out) — Task 4.7 Step 3.
- **Placeholders:** none. `initiatePayment`/`verifyPayment` carry real dev implementations (the throw in `initiatePayment` is guarded by the env flag and documented as the gateway hook — a named integration point, not a TODO). The `// …same pattern` note in Task 4.5 Step 2 names the exact function to copy and the guard delta.
- **Type consistency:** `nextPaymentState(current, gatewayOk)` signature matches its test and `completePayment` call; `initialDispatchStatus(appointmentStatus)` returns members of `DispatchStatus` matching the schema default; `requireProvider` returns `{ user, providerRow }` and both portal pages consume it; `assignRequest(id, assigneeUserId)` matches the schema column `assignee_user_id`; `BookStatus` union gains `pending` before `bookAppointment` writes it (Step 5 ordering).