# Nutrition Simplification — Design Spec

Date: 2026-09-08 | Status: approved (§1–§4) | Path: architectural
Goal: reduce رژیم و تغذیه to exactly the reference site's flows (sitemap `docs/angabinteb-functional-sitemap.md` §3.4 + §3.8) — nothing more, nothing less.

## 1. Target: 4 routes

| Route | Purpose (reference flow) |
|---|---|
| `/[locale]/foods` (+ `[id]`) | Public lookup table: search + 3-tab detail (macro / 40+ micro / recipe). Slimmed, moved OUT of the authed `(nutrition)` layout. |
| `/[locale]/nutrition/calorie` | کالری شمار: physiology (prefilled) → دوره غذایی list → دوره detail (entries + محاسبه). Authed. Replaces `diary`. |
| `/[locale]/nutrition/diet` (+ `[id]`) | رژیم: org → type → payment → 8-stage registry → AI برنامه. Authed. Keeps current claim gate. |
| `/[locale]/nutrition/body` | بدن من: BMI calculator + registry entry + profile summary. Authed. Prefill source for calorie periods. |

`/nutrition` root redirects to `/nutrition/calorie`. Nav becomes 4 plain links (no cycle banner).

## 2. Calorie counter (دوره model)

- New `intake_period`: id, user_id, title, starts_on, ends_on + physiology snapshot (sex, age, weight_kg, height_cm, activity_level) copied from profile at creation. History never rewrites on later profile edits.
- `food_intake` += `meal_slot` (nullable: صبحانه / ناهار / شام / میان‌وعده) + `period_id` FK nullable. Old rows untouched, no data migration.
- Period creation form prefills physiology from `getPhysiology` (editable per period → snapshot). Period detail reuses `foodPickerOptions` + `logIntake` (extended with slot/period/datetime), entry delete, and one محاسبه button: BMR/TDEE from snapshot vs period totals + deficit/surplus + macro split. Computed live, never stored.
- Legacy day-strip diary UI deleted. Ungrouped old intakes stay in DB, not displayed.

## 3. Diet → AI برنامه (long-form text, NOT structured output)

- Flow unchanged: org → type → price → payment → registry → document. Claim statuses: `pending → paid → generating → ready`. Retry button on failure; never an empty document.
- Generation: Vercel AI SDK `ai` v7 `generateText`, high `maxTokens`, verbosity-forward Persian system prompt (day-by-day tables, Persian portion units, exchange lists). Provider package pinned when model is chosen; start on Gateway default (`bun add ai` only). No `@ai-sdk/react`, no chat UI.
- AI input: 8-stage registry (§3.7) + physiology + intake-period summaries + program type. Max 1–2 optional extra fields if the prompt needs something missing (e.g. cooking facilities).
- New `diet_documents`: id, claim FK, model name, prompt version, markdown body, created_at. Served through existing `getProgramContent` claim gate; rendered as simple text on dashboard. Footer line: AI-draft, specialist review.
- Delivery notification via existing `notifications` insert.

## 4. Body, redirects, tests

- `/body`: BMI widget + registry entry card + profile summary only.
- Redirects → replacements: `/nutrition` → `/nutrition/calorie`; `/nutrition/diary`, `/nutrition/nutrition`, `/food-analysis/*`, `/booking/offline-diet*` → mapped target; `foods/meal-type/[type]` folds into `/foods?category=`. Delete: 730-line dashboard, guest funnel pages, offline-diet stubs, alias route, `NutritionNav` cycle banner.
- Tests: keep kernel math suites; add period-totals test, claim-transition test (`paid→generating→ready` + retry), redirect tests. Admin CRUD untouched.

## 5. Non-goals

No structured/Zod AI output, no streaming chat UI, no Hono, no background-job infra (generation runs in the claim action; VPS timeouts acceptable), no directory renames, no changes to booking/content/identity contexts. Registry wizard fields follow §3.7 exactly — no invention.
