# Angabin Teb — Purge Design: Manager-Aligned Simplified Platform

> **Status:** Draft 2026-09-02. Complements `2026-08-31-angabin-teb-design.md` (full spec). This doc re-scopes the codebase to the manager's vision — everything outside it is deleted.
> **Source of truth for purge:** Manager message 2026-09-02 (booking for doctors/clinics/services by specialty/type; rehab/home-care/ambulance as plain services; nutrition body→calorie/nutrient analysis + diet; food/educational blog article/video/pamphlet/FAQ; 3 locales; accounts/appointments; paid = pre-made downloadable content).
> **Team:** Solo dev, greenfield, seeded data. Stack unchanged (Next 16.3, TS 7.0.2, Tailwind v4, drizzle 0.45, better-auth 1.7.2, next-intl 4, Node 26.7, Postgres 17, bun).

---

## 1. What stays (manager vision)

| Area | Scope |
|---|---|
| Catalog | Providers (person/org), practitioner bio, locations, service_categories, services (service_type: diagnostic/therapy/home_care/rehab/ambulance/consultation — all as plain rows, no per-type satellite behavior). Search (FTS) + doctors/services discovery pages. |
| Booking | One kernel: slot generation + booking with capacity guard (`UPDATE ... booked_count+partySize<=capacity` + `slotRes.count`), booking status `confirmed/cancelled/completed/no_show` only, party_size 1-4, idempotency, notifications, admin overview/bookings. |
| Nutrition | Physiology profile (sex/birth/height/weight/activity → BMR/TDEE via Mifflin-St Jeor), foods + serving_units + food_nutrient + daily_nutrition rollup, diet_programs + diet_claim. Food browse/search/detail + diary. |
| Content | Topics, conditions, content (article/pamphlet/faq/video), topic hubs (content filtered by topic + related services/practitioners), search union. Video is `content.kind='video'` or `practitioner.video_url` — no separate media table. |
| Platform | Translation overlay (base Persian + non-Persian overrides), locale negotiation (proxy.ts), RTL logical props, admin console (providers/services/categories/locations/scheduling/foods/diet-programs/content/topics/settings/support basic). |
| Identity | Phone OTP via better-auth, roles patient/admin (provider role removed), user/appointment dashboard, support_request basic queue. |

Paid = downloadable content after payment: diet_program/content pamphlet is the paid artifact (price + claim). No appointment payment flow.

---

## 2. What is purged (outside manager vision)

| # | Subsystem | Files/tables removed | Why out of scope |
|---|---|---|---|
| P1 | **Appointment online payments** | `src/lib/payments.ts`, `src/contexts/booking/payment-actions.ts`, `src/contexts/booking/__tests__/payment.test.ts`, `src/app/[locale]/(booking)/pay/**`, kernel `BookingStatus pending` + `nextPaymentState` + `canCancel(pending)` + `cancelAppointment inArray(pending)` + `bookAppointment` PAYMENT_GATEWAY branch + `PAYMENT_GATEWAY` env | Manager: paid = downloadable content, not appointment charge. Pay-at-location only. |
| P2 | **Home-care serviceability** | `src/contexts/booking/address.ts` + `__tests__/address.test.ts`, appointments `home_city_id`/`home_address_line` columns + migration 0007, serviceability branch in `booking/actions.ts`, address step in `components/booking/slot-picker.tsx` + `book/page.tsx`, `homeCareInfo` in `catalog/queries.ts`, `home_care_service` satellite rows in seed beyond plain service | Manager lists home-care as a plain service. No city-based restriction. |
| P3 | **Ambulance dispatch subsystem** | `src/db/schema/ambulance.ts` + `dispatch_record` table (migration 0008), `src/contexts/booking/ambulance.ts` + `__tests__/ambulance.test.ts`, dispatch insert in `booking/actions.ts`, `(marketing)/ambulance` page + `ambulance.*` messages, `listServices` serviceType filter added for it, `homeCareServices`/`ambulanceServices` seed satellites for these types | Manager lists ambulance as plain private-ambulance service. No dispatch tracking, no marketing ambulance page needed. The `ambulance_service` satellite in `catalog.ts` stays empty (harmless) or is dropped — keep the table definition, delete only the dispatch behavior. |
| P4 | **Provider portal** | `src/app/[locale]/provider/**`, `src/app/[locale]/provider-claim/**`, `requireProvider` in `identity/actions.ts`, `listMyServices`/`listMySlots`/`updateMyService`/`generateMySlots`/`deactivateSlot` in catalog/queries+actions, `/api-test/login` `?role=provider` branch, `prov-portal-1`/`svc-provider-1` seed fixtures | Manager describes provider discovery/booking, not provider self-service. Admin manages providers. |
| P5 | **Support assignment/priority** | `support_request.assignee_user_id` column (migration 0009), `assignRequest`/`updateRequestPriority`/`listAdminUsers` + tx+notification, queue assignee/priority UI, `admin-seed-2` seed | Manager: no support assignment in vision. Keep `support_request` with status only + basic queue. `priority` column already existed pre-purge — keep as data, drop the UI/actions that manage assignment. |

Also reverted: `OPEN_QUESTIONS.md` entries that reference purged subsystems (emergency dispatch, payment refunds) are trimmed to match the simplified scope.

---

## 3. Post-purge architecture

One Next.js app, one Postgres, same 6 contexts (identity/catalog/booking/nutrition/content/support + platform cross-cutting). Changes:

- **Booking kernel** — `BookingStatus = confirmed/cancelled/completed/no_show` only. `canCancel = status==='confirmed'`. `bookAppointment` inserts `status:'confirmed'` unconditionally. No `PAYMENT_GATEWAY` branch.
- **Catalog** — `serviceType` enum stays (all 6 values) but no code branches on it except `diagnostic` prep info. `homeCareServices`/`ambulanceServices` tables remain defined but have no behavior attached (zero branching). `listServices` loses the `serviceType` param added for ambulance; discovery `services/page.tsx` loses the searchParam passthrough.
- **Support** — `support_request` keeps `priority` as a stored field (no UI), `status` drives the queue. `assignee_user_id` gone.
- **Identity** — roles `patient/admin` only; `requireProvider`/`requireAdmin` → `requireAdmin` only.
- **Migrations** — new migrations 0010+ drop the purged columns/tables (or keep tables empty and drop behavior only — decision: drop columns/tables to keep schema honest; see §5.3).

---

## 4. Data flow after purge

```
discovery (doctors/services/search, no serviceType filter)
  → service page (prep box for diagnostic only)
  → book page (date picker + SlotPicker time grid only, no address step)
  → bookAppointment (select svc → capacity UPDATE → insert confirmed + notification) → /confirm
  → account/appointments + notifications
nutrition (body→BMR/TDEE → food browse/diary → daily rollup → diet claim)
content (topics → articles/FAQ/videos → topic hub query)
admin (all CRUD + scheduling + foods/diet + support status-only queue)
```

No branching on `service_type` in booking. No payment redirect. No provider self-service.

---

## 5. Risks & decisions

| Risk | Mitigation |
|---|---|
| Dropping `pending` breaks no existing flow when `PAYMENT_GATEWAY` unset (default is confirmed already). | Verified: `bookAppointment` default inserts confirmed; no test depends on pending. |
| Dropping `home_city_id`/`home_address_line` loses 1 migration's columns — appointments that used them will read null. No production data. Acceptable. | Migration 0010 drops columns; `ALTER TABLE appointment DROP COLUMN` is safe on empty DB. |
| Dropping `dispatch_record` FK to appointment — `/api-test/setup` currently `DELETE FROM appointment ...` without touching dispatch. After purge, no FK to worry about. | Setup stays as is. |
| Removing provider portal strands no user — only `test-provider` used it (seed). | Delete seed fixture + login branch together. |
| Support queue loses assignment — admin must triage by scanning. Acceptable for simplified ops. | Keep status-only queue. |

---

## 6. Testing

- Deleted tests (`address.test.ts`, `ambulance.test.ts`, `payment.test.ts`) are removed with their modules — no gaps.
- Remaining tests still pass: `kernel.test.ts` (booking), `scheduling.test.ts`, `search.test.ts`, nutrition kernels, `hub.test.ts`.
- E2E `extended.spec.ts` (home-care unserviceable city + provider slot generation) is deleted — its fixtures are gone. Journeys J-001, knowledge J-005, nutrition J-004 remain as the launch journeys.
- Gate: `bunx tsc --noEmit` + `bun run lint` (oxlint) exit 0.

---

## 7. Change log

| Date | Change |
|---|---|
| 2026-09-02 | Purge design: 5 subsystems deleted to match manager vision. |
