# Nutrition Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink رژیم و تغذیه to 4 dead-simple routes (foods, calorie, diet, body) per the approved design.

**Architecture:** دوره grouping via one new table + 2 nullable columns (no data migration); calorie pages reuse existing picker/kernel/queries; diet AI via Vercel AI SDK `generateText` long-form Persian markdown stored in `diet_documents` and shown as plain text; dead routes removed with `proxy.ts` redirects (the repo's established mechanism — route groups are URL-invisible, canonical links use the `/nutrition/...` prefix which `proxy.ts` rewrites).

**Tech Stack:** Next 16 App Router RSC, Drizzle + postgres.js, Zod, better-auth, `ai` v7 (`generateText` only, no `@ai-sdk/react`), bun.

**Spec:** `docs/superpowers/specs/2026-09-08-nutrition-simplification-design.md`

## Global Constraints

- Package manager is `bun` only (`bun add`, `bunx`, `bun run`). Never pnpm/npm.
- `import "server-only"` line 1 in every server-only file; DAL reads wrapped in `cache()` from `react` (existing pattern in `src/contexts/nutrition/queries.ts:1-2`).
- RTL: logical Tailwind props only (`text-start`, `ms/me`, `ps/pe`). Never `pl/pr/left/right`.
- Icons: `lucide-react` direct imports only. `messages/fa.json` is source of truth; add `en`/`ar` overrides for every new key.
- Verify after every task: `bunx tsc --noEmit` = 0 errors, `bun run lint` = 0 errors (pre-existing `no-await-in-loop` warnings in catalog/content/nutrition actions accepted).
- UX law (neanderthal rule): ONE primary CTA per screen; one question group per step with progress label (قدم ۱ از ۲); plain Persian labels, zero jargon; every empty state = one sentence + exactly one button; touch targets `py-3` minimum; errors inline under the field in Persian; mobile = cards, never tables.

---

### Task 1: دوره schema migration

**Files:**
- Modify: `src/db/schema/nutrition.ts`
- Create: migration via `bun run db:generate`
- Test: `bun run db:generate` dry check + `bunx tsc --noEmit`

**Interfaces:**
- Consumes: `users.id` from `./identity`
- Produces: `intakePeriods` table + `foodIntakes.mealSlot` / `foodIntakes.periodId` used by Task 2

- [ ] **Step 1: Append period table + intake columns to schema**

In `src/db/schema/nutrition.ts` after `dailyNutrition`, add (keep existing exports untouched):

```ts
export const intakePeriods = pgTable(
  "intake_period",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    sex: text("sex").notNull(),
    age: integer("age").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
    heightCm: numeric("height_cm", { precision: 5, scale: 1 }).notNull(),
    activityLevel: text("activity_level").notNull().default("moderate"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("period_user").on(t.userId)],
);
```

Extend `foodIntakes` columns (additive, nullable — old rows keep working):

```ts
mealSlot: text("meal_slot"), // صبحانه | ناهار | شام | میان‌وعده
periodId: text("period_id").references(() => intakePeriods.id, { onDelete: "set null" }),
```

and add `index("intake_period").on(t.periodId)` to its index array.

- [ ] **Step 2: Export from barrel**

In `src/db/schema/index.ts`, if it lists tables explicitly, add `intakePeriods`. If it is `export *`, skip this step.

- [ ] **Step 3: Generate migration**

Run: `bun run db:generate`
Expected: new `src/db/migrations/NNNN_*.sql` containing `CREATE TABLE intake_period` + `ALTER TABLE food_intake ADD COLUMN`. No `DROP`, no data backfill.

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema/nutrition.ts src/db/schema/index.ts src/db/migrations/
git commit -m "feat(nutrition): intake period table + meal slot columns"
```

---

### Task 2: Period DAL + totals (TDD)

**Files:**
- Modify: `src/contexts/nutrition/queries.ts` (append; keep `server-only` + `cache` pattern)
- Modify: `src/contexts/nutrition/actions.ts` (append `createPeriod`, `deleteIntake`)
- Create: `src/contexts/nutrition/__tests__/period.test.ts`

**Interfaces:**
- Consumes: `intakePeriods`, `foodIntakes`, `servingToGrams`/`nutrientsForIntake` from `./kernel`, `bmr`/`tdee` from `./kernel`
- Produces: `createPeriod`, `listPeriods`, `getPeriod`, `periodTotals`, `deleteIntake` used by Task 4

- [ ] **Step 1: Write the failing test**

`src/contexts/nutrition/__tests__/period.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validatePeriodInput } from "../actions";

describe("period validation", () => {
  it("rejects end before start", () => {
    const r = validatePeriodInput({ title: "هفته ۱", startsOn: "2026-09-10", endsOn: "2026-09-01" });
    expect(r.ok).toBe(false);
  });
  it("accepts a sane week", () => {
    const r = validatePeriodInput({ title: "هفته ۱", startsOn: "2026-09-01", endsOn: "2026-09-07" });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/contexts/nutrition/__tests__/period.test.ts`
Expected: FAIL with "validatePeriodInput is not defined/exported".

- [ ] **Step 3: Minimal queries + validation**

Append to `queries.ts` (same `cache(async ...)` style as `dayIntake`):

```ts
export const listPeriods = cache(async (userId: string) => {
  return db.select().from(intakePeriods)
    .where(eq(intakePeriods.userId, userId))
    .orderBy(desc(intakePeriods.startsOn));
});

export const getPeriod = cache(async (userId: string, id: string) => {
  const [row] = await db.select().from(intakePeriods)
    .where(and(eq(intakePeriods.id, id), eq(intakePeriods.userId, userId)));
  return row ?? null;
});

export const periodEntries = cache(async (userId: string, periodId: string) => {
  return db.select({
    id: foodIntakes.id, foodName: foods.name, servingUnitName: servingUnits.name,
    quantity: foodIntakes.quantity, mealSlot: foodIntakes.mealSlot, loggedAt: foodIntakes.loggedAt,
    gramsEquivalent: servingUnits.gramsEquivalent, foodId: foodIntakes.foodId,
  }).from(foodIntakes)
    .innerJoin(foods, eq(foodIntakes.foodId, foods.id))
    .innerJoin(servingUnits, eq(foodIntakes.servingUnitId, servingUnits.id))
    .where(and(eq(foodIntakes.userId, userId), eq(foodIntakes.periodId, periodId)))
    .orderBy(foodIntakes.loggedAt);
});
```

`periodTotals` reuses the kernel (no new math): for each entry `nutrientsForIntake(servingToGrams(qty, gramsEq), per100g)` where per100g comes from `foodNutrients` rows for that food, then `sumDay`. BMR/TDEE from the period snapshot via `bmr()`/`tdee()` + `macroSplit()` — same functions `body/page` uses.

In `actions.ts` export pure `validatePeriodInput({title, startsOn, endsOn})` (title 1–80 chars, valid dates, endsOn ≥ startsOn, span ≤ 62 days) plus `createPeriod` (requireUser, snapshot physiology from `getPhysiology` overlaid with form values, `randomUUID` id) and `deleteIntake` (requireUser, delete where id + userId — user can only remove own rows).

- [ ] **Step 4: Run tests green + typecheck**

Run: `bun run test -- src/contexts/nutrition/__tests__/period.test.ts` → PASS. Then `bunx tsc --noEmit` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/nutrition/queries.ts src/contexts/nutrition/actions.ts src/contexts/nutrition/__tests__/period.test.ts
git commit -m "feat(nutrition): period DAL, totals, validation"
```

---

### Task 3: Extend intake logging (slot + period + datetime)

**Files:**
- Modify: `src/contexts/nutrition/actions.ts` (`logIntake` schema only)
- Modify: `src/components/nutrition/log-food.tsx` (add meal-slot select + datetime input)

**Interfaces:**
- Consumes: `periodEntries` shape from Task 2
- Produces: extended `logIntake` used by Task 4; old callers keep working (new fields optional)

- [ ] **Step 1: Extend intakeSchema (backward compatible)**

```ts
const intakeSchema = z.object({
  foodId: z.string().min(1),
  servingUnitId: z.string().min(1),
  quantity: z.number().positive(),
  mealSlot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  periodId: z.string().min(1).optional(),
  loggedAt: z.string().datetime().optional(),
});
```

`logIntake` writes `mealSlot ?? null`, `periodId ?? null` (verify period belongs to user first: one `getPeriod` check, throw "invalid period" otherwise), `loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date()`. Daily rollup logic untouched.

- [ ] **Step 2: Logger UI additions**

In `log-food.tsx`: one `select` (4 Persian slot labels, default by hour: 5–10 صبحانه، 11–15 ناهار، 16–18 میان‌وعده، else شام) + one `datetime-local` (default now). Hidden `periodId` prop when rendered inside a period. Submit button stays the single CTA; labels plain Persian.

- [ ] **Step 3: Verify old diary caller + typecheck**

Run: `bunx tsc --noEmit` → PASS. Run: `bun run test` → all green (existing intake tests must pass unchanged — proves backward compat).

- [ ] **Step 4: Commit**

```bash
git add src/contexts/nutrition/actions.ts src/components/nutrition/log-food.tsx
git commit -m "feat(nutrition): meal slot + period on intake entries"
```

---

### Task 4: Calorie pages + proxy + redirects (the neanderthal core)

**Files:**
- Create: `src/app/[locale]/(nutrition)/calorie/page.tsx` (period list)
- Create: `src/app/[locale]/(nutrition)/calorie/[id]/page.tsx` (entries + محاسبه)
- Modify: `src/proxy.ts` (add `calorie` to rewrite list + 307 redirects for nuked paths)
- Test: extend `src/app/[locale]/(nutrition)/__tests__/nutrition.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`listPeriods`, `getPeriod`, `periodEntries`, `periodTotals`, `createPeriod`, `deleteIntake`), Task 3 (`LogFood`)
- Produces: canonical `/nutrition/calorie` route used by Task 6 nav

Screen law: list screen = title + "دوره جدید" button + period cards (title, dates, entry count) + nothing else. New-period form (same page, `<details>` or below list): title, start/end date, physiology shown as read-only summary from `getPhysiology` with "ویرایش در بدن من" link + editable override fields prefilled. Detail screen: profile snapshot strip (1 line) → entry list (cards: food, slot chip, qty, time, delete) → `LogFood` → ONE محاسبه button → result card (BMR, TDEE, consumed, remaining, 3 macro bars). Calculate is a server-computed RSC render on `?calc=1`, no client state.

- [ ] **Step 1: List page with single CTA + empty state**

RSC: `requireUser` → `listPeriods`. Empty state: one sentence (`calorieEmpty`) + one button (`calorieNewCta` → `#new`). Add `fa` keys + `en`/`ar` overrides in `messages/`.

- [ ] **Step 2: Detail page with محاسبه**

RSC with `searchParams.calc`: entries via `periodEntries`, totals via `periodTotals` only when `calc=1` (else show "برای دیدن نتیجه، محاسبه را بزنید" + button). Delete = tiny server-action form per row (`deleteIntake`). Entry form = Task 3 `LogFood` with `periodId`.

- [ ] **Step 3: proxy.ts — calorie rewrite + nuked-path redirects**

Add `"calorie"` to the existing `["diary","body","diet","foods"]` rewrite list. Above it, add temporary 307s (same style as bare-link 307): `/fa/nutrition/diary` → `/fa/nutrition/calorie`, `/fa/nutrition/nutrition` → `/fa/nutrition/calorie`, `/fa/food-analysis/*` → `/fa/nutrition/calorie`, `/fa/booking/offline-diet*` → `/fa/nutrition/diet`, `/fa/foods/meal-type/*` → `/fa/foods`. Preserve searchParams via `req.nextUrl.search`.

- [ ] **Step 4: Tests for routes**

In `nutrition.test.tsx`: period list renders CTA; detail with `calc=1` shows BMR number; proxy maps `/fa/nutrition/calorie` → rewrite (unit-test the prefix logic by extracting? keep to page render + manual `dev` check of redirects, noted in commit message).

- [ ] **Step 5: Verify + commit**

Run: `bunx tsc --noEmit`, `bun run lint`, `bun run test` → all green.

```bash
git add src/app/[locale]/\(nutrition\)/calorie/ src/proxy.ts messages/ src/app/[locale]/\(nutrition\)/__tests__/nutrition.test.tsx
git commit -m "feat(nutrition): calorie periods replace diary"
```

---

### Task 5: AI برنامه (long-form text)

**Files:**
- Create: `src/lib/ai-diet.ts` (`server-only`, prompt builder + `generateDietPlan`)
- Modify: `src/db/schema/nutrition.ts` (+ `diet_documents`), generate migration
- Modify: `src/contexts/nutrition/actions.ts` (`generateProgramDocument(claimId)`)
- Modify: `src/app/[locale]/(nutrition)/diet/[id]/page.tsx` (show document text / generating state / retry)
- Test: `src/contexts/nutrition/__tests__/diet-document.test.ts` (prompt contains registry fields; status transitions with mocked generator)

**Interfaces:**
- Consumes: `getProgramContent` gate, registry answers, `getPhysiology`, `listPeriods` summaries
- Produces: `diet_documents` rows rendered as plain text; statuses `paid → generating → ready`

- [ ] **Step 1: Install SDK**

Run: `bun add ai`
Expected: `ai@^7` in `package.json` dependencies. No provider package yet (Gateway default; model via `AI_MODEL` env, key via `AI_API_KEY`).

- [ ] **Step 2: Failing test for prompt + transitions**

```ts
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { buildDietPrompt } from "../../lib/ai-diet";

describe("diet prompt", () => {
  it("embeds physiology + program type + registry note", () => {
    const p = buildDietPrompt({ sex: "female", age: 40, weightKg: 80, heightCm: 165, activityLevel: "light", programType: "کاهش وزن", registrySummary: "دیابت نوع ۲" });
    expect(p).toContain("کاهش وزن");
    expect(p).toContain("دیابت نوع ۲");
    expect(p).toContain("80");
  });
});
```

Run: `bun run test -- src/contexts/nutrition/__tests__/diet-document.test.ts` → FAIL (module missing).

- [ ] **Step 3: `ai-diet.ts` + documents table + action**

`src/lib/ai-diet.ts` (line 1 `import "server-only"`): `buildDietPrompt` (pure, Persian system + user context: program type, physiology, registry summary, period averages; demands day-by-day tables in Persian units, high detail) + `generateDietPlan` calling `generateText({ model: process.env.AI_MODEL ?? "openai/gpt-5.4", maxTokens: 8000, system, prompt })` returning `text`. Table:

```ts
export const dietDocuments = pgTable("diet_document", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => dietClaims.id, { onDelete: "cascade" }).unique(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull().default("v1"),
  bodyMarkdown: text("body_markdown").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

`generateProgramDocument(claimId)`: requireUser → load claim (own, status `paid`) → set `generating` → gather context → `generateDietPlan` → insert document → set `ready`; on throw, leave `generating` (retry button re-calls). Footer appended server-side: "پیش‌نویس تولیدشده با هوش مصنوعی — نیازمند بازبینی متخصص."

- [ ] **Step 4: Detail page states**

In `diet/[id]/page.tsx`: if document exists → plain-text section (single "دانلود/چاپ" button via print CSS). Else if claim `generating` → "در حال آماده‌سازی…" + auto note. Else if claim `paid` → ONE button "شروع آماده‌سازی برنامه". Else existing claim flow untouched.

- [ ] **Step 5: Verify + commit**

Run: `bun run db:generate`, `bunx tsc --noEmit`, `bun run lint`, `bun run test` → green.

```bash
git add package.json bun.lock src/lib/ai-diet.ts src/db/schema/nutrition.ts src/db/migrations/ src/contexts/nutrition/actions.ts "src/app/[locale]/(nutrition)/diet/[id]/page.tsx" src/contexts/nutrition/__tests__/diet-document.test.ts messages/
git commit -m "feat(nutrition): AI diet program text generation"
```

---

### Task 6: Body slim + foods public + nav + nukes

**Files:**
- Modify: `src/app/[locale]/(nutrition)/body/page.tsx` (strip to BMI + registry card + summary)
- Move: `src/app/[locale]/(nutrition)/foods/**` → `src/app/[locale]/(discovery)/foods/**` (public; `git mv`)
- Modify: `src/components/nutrition/nutrition-nav.tsx` (4 plain links)
- Delete: `(nutrition)/page.tsx` content → redirect; `(nutrition)/nutrition/`, `(nutrition)/diary/`, `(nutrition)/food-analysis/`, `(nutrition)/booking/`, `(nutrition)/foods/meal-type/` leftovers
- Modify: `src/app/[locale]/(nutrition)/layout.tsx` (keep auth wall — foods no longer under it)

**Interfaces:**
- Consumes: Task 4 routes, Task 5 diet detail
- Produces: final 4-route information architecture

- [ ] **Step 1: Slim body page**

Delete: TDEE dual cards detail, goal-targets grid, next-steps link row. Keep: physiology form (unchanged action), BMI card, one registry entry card (single CTA), profile summary line. Page = form + BMI + registry card. Nothing else.

- [ ] **Step 2: Move foods public**

```bash
git mv "src/app/[locale]/(nutrition)/foods" "src/app/[locale]/(discovery)/foods"
```

Fix imports/links (`/nutrition/foods` → `/foods`; proxy already rewrites both, but canonical links must be `/foods`). Verify no `requireUser` in moved files or their new layout chain. Delete `meal-type/[type]` folder; add its category as `?category=` default in `foods/page.tsx` search form.

- [ ] **Step 3: Nav = 4 links**

Rewrite `nutrition-nav.tsx` items: کالری شمار (`/nutrition/calorie`), رژیم (`/nutrition/diet`), بدن من (`/nutrition/body`), غذاها (`/foods`). Delete cycle banner block, step badges. Keep active-state styling.

- [ ] **Step 4: Delete dead routes, root redirect**

`(nutrition)/page.tsx` → `redirect(/nutrition/calorie)` (keep file, 3 lines). Delete folders: `(nutrition)/nutrition/`, `(nutrition)/diary/` (after Task 4 merged), `(nutrition)/food-analysis/`, `(nutrition)/booking/`. Confirm `proxy.ts` redirects from Task 4 cover each deleted URL; add any missing.

- [ ] **Step 5: Verify + commit**

Run: `bunx tsc --noEmit`, `bun run lint`, `bun run test`, `bun run build` (build catches dead imports/links). Fix or delete stragglers.

```bash
git add -A
git commit -m "feat(nutrition): 4-route IA, public foods, remove dead flows"
```

---

### Task 7: Full verification + e2e smoke

**Files:** none (verification only) unless fixes needed.

- [ ] **Step 1: Unit + type + lint**

Run: `bunx tsc --noEmit` → 0 errors. Run: `bun run lint` → 0 errors. Run: `bun run test` → 24+ suites pass (new: period, diet-document).

- [ ] **Step 2: Production build**

Run: `bun run build`
Expected: all routes compile; no references to deleted paths (`food-analysis`, `offline-diet`, `meal-type`, `nutrition/nutrition`).

- [ ] **Step 3: Seeded click-through (needs `docker compose up -d` + `db:migrate` + seeds)**

`bun run dev`, then walk: new period → add 2 entries → محاسبه shows numbers; diet claim → paid → generating → ready text; body BMI; `/fa/nutrition/diary` lands on calorie (307). Record failures as follow-up todos, do not expand scope.

- [ ] **Step 4: Commit fixes only if needed**

```bash
git add -A
git commit -m "fix(nutrition): verification fallout"
```

Skip if green.
