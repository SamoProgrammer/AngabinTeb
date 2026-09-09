# Profile-Centric Nutrition Relocation — Design Spec (2026-09-09)

## Context
The simplified 4-route nutrition IA (`(nutrition)`: calorie, diet, body + `(discovery)`: foods) is still overwhelming: program pages mix tracking, registry, and results. Reference: `docs/angabinteb-functional-sitemap.md` §3.4 (food DB + calorie engine), §3.7 (8-stage registry), §3.8 (offline-diet app + 6-stage funnel), §3.6 (patient portal). Decision: **Approach B with A's machinery** — relocate nutrition programs physically under `/profile/*`; keep snapshots, resumable claims, review step, admin queue, and public foods/calculator.

## §1 Route map
**Profile hub (auth-walled, `(account)` group):**
- `/profile` — hub: identity summary, my-diets status list, active calorie summary, body snapshot. Cards link out; no heavy forms.
- `/profile/clinical` — 8 registry sections as editable cards. Replaces `/registry/form/*` (307 → here).
- `/profile/diets` + `/profile/diets/[id]` — diet claims with statuses + result documents.
- `/profile/calorie` + `/profile/calorie/[id]` — relocated tracker (periods, entries, محاسبه).
- `/profile/body` — weigh-ins log + weight chart + BMI display (calculator half removed).
- `personal-info`, `reservations`, `balance`, `messages` untouched.

**Public (no auth):**
- `/foods` + `/foods/[id]` — unchanged, pure data source for the tracker.
- `/calculator` (new) — public BMI/BMR/TDEE calculator ending in signup CTA.
- `/diet` wizard entry — type → tier → org browsable publicly; auth wall at payment.

**Redirects (`proxy.ts` 307s, searchParams preserved):** `/nutrition/calorie*` → `/profile/calorie*`, `/nutrition/body` → `/profile/body`, `/registry/form/*` → `/profile/clinical`, `/nutrition/diet*` → `/diet*` or `/profile/diets*` as appropriate. `(nutrition)` group deleted after the move.

**Guest funnel preserved:** calculator, foods, diet browsing public; login demanded only at payment or personal-data steps.

## §2 Data model
- **`registry_snapshot`** (new): frozen JSONB of all 8 registry sections + vitals, `claim_id` FK unique, written once at payment. Profile edits never touch it; admin reviews it, not live data.
- **`diet_claim` statuses**: `pending → paid → generating → needs_review → ready` (+ `failed` after exhausted retries). Existing partial unique index (`status != 'completed'`) untouched. `pending` claims make the wizard resumable.
- **Org ≠ type in schema**: claim carries `organization_id` (nullable, insurance/affiliation, affects price) + `diet_program_id` (clinical type, one of the 18 seeded categories). Final price computed from tier + org at payment, stored on the claim.
- **`weigh_ins`** (new): `user_id`, `weight_kg`, `logged_at`. Powers body chart + calorie history. BMI always computed, never stored.
- **Unchanged**: `diet_document` (long-form markdown, claim FK unique), `food_intake` / `intake_period`, identity tables. Verified read-only fields (national code, phone) excluded from clinical mutations.
- **Non-goal**: one snapshot per claim, no snapshot versioning; re-orders re-snapshot.

## §3 Diet wizard flow
Six steps, one question per screen, state on the `pending` claim (refresh/back safe):
1. **Type** — 18 clinical categories, cards, public.
2. **Tier** — Bronze / Silver / Gold / VIP + duration + price, public.
3. **Organization** — optional affiliation for insurance pricing, default "بدون سازمان", live price preview, public.
4. **Payment** — auth wall (first forced login). Success: `pending → paid` + snapshot frozen.
5. **Registry check** — complete → auto-pass; else inline only the missing sections, then submit.
6. **Status** — `/profile/diets/[id]`: timeline (`generating → needs_review → ready`), SMS + in-app notice on ready, document renders in place.

**Failure paths**: payment fails → stays `pending`, resume at step 4. AI throws / no key → stays `generating` with retry counter; 3 exhausted auto-retries → `failed` + admin ping. Registry edited mid-`generating` → no effect (frozen); one-line banner on the status page says so.

## §4 Admin ops (extend `admin/diet-programs`)
Claim queue table (claimant, type, tier, org, status chip, age timer), row actions as idempotent server actions:
- View snapshot (frozen, read-only, reproducible review).
- Retry generation (same idempotency key as auto-retry, safe to hammer).
- Approve (`needs_review → ready`, publishes to patient) / request changes (note to `/profile/messages`, claim back to `generating` with note as context).
- View / edit document (markdown textarea; typo fixes without regen).
- Cancel + refund note (`failed`/abuse; writes the ledger entry the wallet flow understands).
Existing admin guard + audit logging reused. **Non-goal**: no WYSIWYG or diff view.

## §5 Migration, redirects & testing
- **One migration**: create `registry_snapshot` + `weigh_ins`; add claim columns; extend status check; backfill one `weigh_ins` row per user from latest known weight. Index names `table_column_idx` (0017 namespace lesson).
- **Move, don't rewrite**: pages relocate; components (`log-food`, pickers, calculators) move untouched. Locale keys move with components; dead keys purged.
- **Release order**: migrate prod DB first, verify tables exist (silent-migrate lesson), then deploy. Single release; redirects make it atomic for users.
- **Tests**: unit — snapshot-freeze-on-payment, status transitions incl. `needs_review`, tier+org price math, pending-step recovery. `tsc` + `lint` + `test` + `build` green. E2E specs on old routes rewritten (human-verification item; needs seeded dev server).
- **UX law carries over**: one primary CTA per screen, Jalali pickers only, logical RTL props, cards-not-tables, `py-3` targets.
