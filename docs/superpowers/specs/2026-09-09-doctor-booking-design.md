# Per-Doctor Booking Remake — Design Spec

Date: 2026-09-09 | Status: approved (design in chat) | Path: architectural
Goal: replace the global slot generator with per-doctor weekly schedules + exceptions, and remake the admin booking experience into a doctor workspace (schedules → slots → bookings: who, when, status).

Decisions locked: service-first booking stays; weekly template; admin gets view + cancel/complete/no-show (no admin-created walk-ins in v1); approach B (schedule table + exceptions).

## 1. Current state (ground truth)

- `availability_slot`: id, provider_id, service_id, starts_at, ends_at, capacity default 1, is_active, booked_count, held_until/held_by. Slots are generated globally via `generateSlots({serviceId, providerId, weekday, startsAt, endsAt, durationMinutes, capacity, fromDate, toDate})` — no per-doctor defaults, no recurring template stored, no exception days, no bookings view.
- `appointment`: service_id, provider_id, location_id, slot_id, party_size, status `confirmed | cancelled | completed | no_show`, price from `service.base_price`. Partial unique index `one_booking_per_slot` on slot_id where status not in (cancelled, no_show) — effectively 1 active booking per slot. Booking/cancel/reschedule use conditional `UPDATE availability_slot SET booked_count ... WHERE ... booked_count + party <= capacity` (never SELECT+check) and `generateSlots` uses `SELECT ... FOR UPDATE` on the service row.
- Admin today: `/admin/scheduling` (single global form), `/admin/providers` (flat table → profile form only), `/admin/services` (no schedule link). No slot list, no bookings list.
- Patient today: service-first (`/services/[slug]/book`, `/booking/...`). Doctor pages are thin wrappers. Slot display already groups morning/evening.

## 2. Schema (2 new tables, 0 breaking changes)

`doctor_schedule` — the weekly template, one row per (provider, service, weekday, start-time):
- id text PK, provider_id FK provider, service_id FK service, weekday int 0–6 (0=Sunday, matching existing `expandPattern`), start_time text `HH:MM`, end_time text `HH:MM`, duration_minutes int > 0, capacity int default 1, is_active bool default true, created_at timestamptz.
- Indexes (PG-namespace-safe names): `doctor_schedule_provider_idx` on provider_id, `doctor_schedule_service_idx` on service_id. Unique `doctor_schedule_unique` on (provider_id, service_id, weekday, start_time).

`schedule_exception` — closed / custom days per doctor (optionally per service):
- id text PK, provider_id FK provider, service_id FK service nullable (null = whole doctor closed that day), exception_date date not null, is_closed bool default true, reason text nullable, created_at timestamptz.
- Indexes: `schedule_exception_provider_idx` on (provider_id, exception_date), `schedule_exception_service_idx` on service_id. Unique `schedule_exception_unique` on (provider_id, service_id, exception_date) with nulls treated per-row (enforced in action by delete-then-insert, not DB trick).

No changes to `availability_slot` or `appointment`. `one_booking_per_slot` untouched. Doctor slots default capacity 1; group services may set capacity > 1 per schedule row.

## 3. Admin workspace (the remake)

`admin/providers/[id]` becomes the doctor workspace with 4 tabs (plain links with `?tab=`, default `profile`):

1. **Profile** — existing `ProviderForm` unchanged.
2. **Schedules** — weekly grid, 7 rows (Saturday-first display order for fa, Jalali weekday names from `admin.scheduling.weekdays`). Each row: active toggle, start `type="time"`, end `type="time"`, duration number, capacity number (default 1). One schedule block per service the doctor offers (service selector at top, defaults to doctor's first service). Save = `upsertSchedule` per row; delete = `deleteSchedule`. One primary CTA per tab (Save schedules).
3. **Slots** — date-filtered list (single `JalaliDatePicker` + service selector). Each row: Jalali date-time (`formatJalali*`), capacity vs booked (`booked_count/capacity`), status chip (free / booked / blocked), actions: Block/Unblock (`toggleSlotActive`, blocked = is_active false, only when booked_count = 0), Delete (future + empty only). Generate card on top: from/to `JalaliDatePicker` range + Generate button → `generateSlotsFromSchedules`. Result line: created count (Persian digits) + skipped-closed count + overlap count.
4. **Bookings** — table for this doctor (all services, newest first, 50/page): patient (patient_name ?? account), phone (patient_phone), service, Jalali slot time, party, status chip, actions: Cancel (frees capacity via existing cancel path), Complete, No-show. No admin-created bookings in v1.

`admin/scheduling` page: kept as thin redirect/overview linking into each doctor's workspace (`?tab=slots`). No duplicate generator form. `admin/services/[id]` gains a "schedules" link to the owning doctor workspace.

Conventions: RTL logical props only, `lucide-react` direct imports, `JalaliDatePicker` for all dates (+ `type="time"` for times, never native date inputs), cards-not-tables on narrow screens, `py-3` touch targets, one primary CTA per tab, `fa` keys in `messages/fa.json` first.

## 4. Patient flow (service-first, grouped by doctor)

No route changes. `availabilityForService` extended with optional `providerId` filter; service book page groups slots by doctor then by Jalali day (existing morning/evening split kept). Booking kernel (`bookAppointmentWithUser`), cancel, reschedule untouched — conditional UPDATEs remain the only enforcement points.

## 5. Actions, queries, guards

New catalog actions (`src/contexts/catalog/actions.ts`, async only, `requireAdmin()`):
- `upsertSchedule(input)` / `deleteSchedule(id)` — zod: weekday 0–6, HH:MM regex, end > start, duration ≥ 5, capacity ≥ 1.
- `upsertException({providerId, serviceId?, date YYYY-MM-DD, isClosed, reason?})` / `deleteException(id)`.
- `generateSlotsFromSchedules({providerId, serviceId, fromDate, toDate})` — loads active schedules + exceptions for range, expands per weekday via existing `expandPattern` logic, skips exception dates, `SELECT ... FOR UPDATE` on service row, overlap-checks against existing slots for that service, inserts. Returns `{ ok, created, skippedClosed, overlap }`.
- `toggleSlotActive(slotId, isActive)` — refuses to block a slot with booked_count > 0; refuses to touch past slots.
- `deleteSlot(slotId)` — future + booked_count = 0 + no active appointment only.

New booking admin actions (`src/contexts/booking/actions.ts`):
- `completeAppointmentAsAdmin(id)`, `markNoShowAsAdmin(id)` — confirmed → completed / no_show via `upd.count` guard (same pattern as cancel). Cancel reuses existing capacity-freeing path but under `requireAdmin()` with any appointment id.

New queries (`cache()` + `server-only`):
- `listSchedules(providerId, serviceId?)`, `listExceptions(providerId, from, to)`, `listSlotsForDoctor(providerId, serviceId?, date)`, `listBookingsForDoctor(providerId, {status?, page?})` — joins appointment → slot → service, Jalali formatting at render.

Concurrency: no new locking. Slot take still conditional UPDATE; generation still serializes on service row. Exception insert races resolve by generation-time re-check (exceptions read inside the same transaction as slot insert).

## 6. i18n + seed + tests

- Locale keys under `admin.scheduling` + `admin.bookings` (fa source, en/ar overrides): schedule tab, weekday rows, exceptions, slots table, bookings table + statuses, generate result counts.
- Seed: give each seeded doctor 1 consultation service + 2–3 schedule rows (Sat–Wed mornings) + one sample exception, so the workspace shows data without manual setup.
- Tests (vitest): schedule expansion skips closed dates; service-scoped exception closes only that service; block-refused when booked; complete/no-show transition guards; overlap returns count without insert. e2e: generate per-doctor → book → admin cancel frees slot (reuse double-book spec pattern).

## 7. Non-goals (v1)

No admin-created walk-in/phone bookings, no patient-side reschedule UI change, no recurring-exception rules (e.g. "every Friday"), no SMS/reminder hooks, no price-per-schedule (price stays on service), no calendar drag-drop, no doctor login/portal (admin-only), no changes to nutrition/content/identity.
