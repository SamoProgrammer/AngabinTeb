# Profile-Centric Nutrition Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate nutrition programs under `/profile/*` with a public diet wizard, frozen registry snapshots, a `needs_review` generation chain, and an admin claim queue.

**Architecture:** Move pages (don't rewrite them); extend `diet_claim` + add `registry_snapshot`; generation lands in `needs_review`, admin publishes to `ready`; legacy URLs die via redirects.

**Tech Stack:** Next 16 App Router, Drizzle 0.45 + postgres.js, Zod, next-intl, bun, vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-profile-nutrition-relocation-design.md`

## Global Constraints

- bun only (never pnpm/npm/yarn).
- All date/datetime UI via `JalaliDatePicker` (`@/components/clinical/jalali-date-picker`); native `type="date"`/`datetime-local` forbidden.
- RTL logical Tailwind props only (`ps/pe`, `text-start`, `ms/me`); physical props forbidden.
- lucide-react direct imports only; dynamic names via `resolveIcon` from `@/components/clinical/icons`.
- DAL reads in `contexts/*/queries.ts`: `import "server-only"` line 1 + React `cache()` wrap.
- `"use server"` modules export async functions only; pure helpers live in `kernel.ts`.
- `messages/fa.json` is source of truth; mirror every new key in `en`/`ar`.
- Index names as `table_column_idx` (never bare table names).
- AI diet output stays long-form markdown via `generateText`; statuses flow through `diet_claim`.
- Enumerated `git add` only (never `-A`); one commit per task.

## Grounding deviations from the spec (verified against code)

- **No organizations table exists.** `organizationContext` is a text enum on `diet_program` (`banks|universities|health_centers|clinics|other`), and the diet page's "org selector" is a program filter. So the claim gets `organization_context` TEXT (nullable enum), NOT an `organization_id` FK.
- **`weight_log` already exists** (`src/db/schema/diet-subscription.ts`, zero usages — dead schema). Reuse it instead of creating `weigh_ins`.
- **`diet_subscription` table also exists and is fully unused.** Leave it untouched; do not resurrect it. Optional future cleanup, out of scope.
- **Current `proxy.ts` has NO legacy-URL rewrites** (locale-prefix 307s only). Task 7's first step finds where old-URL redirects actually live (`next.config.*` or proxy) and extends that mechanism.
- `generateProgramDocument` currently flips success straight to `ready`; Task 3 reroutes to `needs_review` and updates the two existing test files accordingly.

## File map

- Create: `src/db/migrations/00XX_*.sql` (via generate), `src/app/[locale]/(account)/profile/clinical/page.tsx`, `src/app/[locale]/(account)/profile/diets/page.tsx`, `src/app/[locale]/(account)/profile/diets/[id]/page.tsx`, `src/app/[locale]/(account)/profile/calorie/` (moved), `src/app/[locale]/(account)/profile/body/page.tsx`, `src/app/[locale]/(account)/profile/page.tsx` (hub), `src/app/[locale]/(diet)/diet/` wizard pages, `src/app/[locale]/calculator/page.tsx`, `src/app/[locale]/admin/diet-programs/claims/page.tsx`, `src/contexts/nutrition/__tests__/relocation-schema.test.ts`
- Modify: `src/db/schema/nutrition.ts`, `src/contexts/nutrition/kernel.ts`, `src/contexts/nutrition/actions.ts`, `src/contexts/nutrition/queries.ts`, `src/contexts/nutrition/__tests__/diet-document.test.ts`, `src/contexts/nutrition/__tests__/claim-gate.test.ts`, `src/proxy.ts` (or `next.config.*`), `messages/{fa,en,ar}.json`
- Delete: `src/app/[locale]/(nutrition)/`, `src/app/[locale]/(account)/registry/`

---

### Task 1: Schema + migration

**Files:**
- Modify: `src/db/schema/nutrition.ts`
- Create: migration via `bun run db:generate`
- Test: `src/contexts/nutrition/__tests__/relocation-schema.test.ts`

**Interfaces:**
- Consumes: existing `dietClaims`, `clinicalRegistries` (8 jsonb sections)
- Produces: `registrySnapshots` table; `dietClaims.organizationContext/pricePaid/retryCount` columns for Tasks 2–5

- [ ] **Step 1: Add the tables/columns to `src/db/schema/nutrition.ts`**

```ts
export const registrySnapshots = pgTable("registry_snapshot", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => dietClaims.id, { onDelete: "cascade" }).unique(),
  personInfo: jsonb("person_info"),
  medicalHistory: jsonb("medical_history"),
  drugHistory: jsonb("drug_history"),
  addictionHistory: jsonb("addiction_history"),
  nutritionInfo: jsonb("nutrition_info"),
  cardiovascularQuestions: jsonb("cardiovascular_questions"),
  anthropometric: jsonb("anthropometric"),
  medicalDocuments: jsonb("medical_documents"),
  snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Add to `dietClaims`: `organizationContext: text("organization_context")` (nullable, no default), `pricePaid: numeric("price_paid", { precision: 12, scale: 0 })` (nullable), `retryCount: integer("retry_count").notNull().default(0)`. Import `jsonb` from `drizzle-orm/pg-core` (extend the existing import on line 1). Export the new table from `src/db/schema/index.ts` if it names tables explicitly (check first; if it's `export *`, skip).

- [ ] **Step 2: Write the schema test**

```ts
import { describe, test, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { dietClaims, registrySnapshots } from "@/contexts/nutrition/kernel"; // placeholder path — see note
```

NOTE: import from `@/db/schema/nutrition` (not kernel — kernel holds pure helpers only). Real test:

```ts
import { describe, test, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { dietClaims, registrySnapshots } from "@/db/schema/nutrition";

const cols = (t: Parameters<typeof getTableConfig>[0]) => Object.keys(getTableConfig(t).columns);

describe("relocation schema", () => {
  test("diet_claim carries org context, paid price, retry counter", () => {
    expect(cols(dietClaims)).toEqual(
      expect.arrayContaining(["organizationContext", "pricePaid", "retryCount"]),
    );
  });
  test("registry_snapshot mirrors the 8 registry sections, one per claim", () => {
    expect(cols(registrySnapshots)).toEqual(
      expect.arrayContaining([
        "claimId", "personInfo", "medicalHistory", "drugHistory",
        "addictionHistory", "nutritionInfo", "cardiovascularQuestions",
        "anthropometric", "medicalDocuments",
      ]),
    );
  });
});
```

- [ ] **Step 3: Run it, watch it pass (pure definition test, no DB needed)**

Run: `bun run test src/contexts/nutrition/__tests__/relocation-schema.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 4: Generate the migration and append data backfills**

Run: `bun run db:generate`
Expected: one new `src/db/migrations/00XX_*.sql`. Append two raw-SQL statements to that file: (a) `UPDATE diet_claim SET status='ready' WHERE status IN ('paid','generating') AND id IN (SELECT claim_id FROM diet_document);` (b) `INSERT INTO weight_log (id, user_id, weight_kg, logged_at) SELECT gen_random_uuid(), user_id, weight_kg, CURRENT_DATE FROM physiology_profile ON CONFLICT DO NOTHING;` — check `weight_log` for a unique constraint first; if none, drop the `ON CONFLICT` clause (duplicates on re-run are harmless seed data, migration runs once).

- [ ] **Step 5: Commit**

```bash
git add src/db/schema/nutrition.ts src/db/schema/index.ts src/contexts/nutrition/__tests__/relocation-schema.test.ts src/db/migrations/00XX_*.sql
git commit -m "feat(nutrition): registry_snapshot table, claim org/price/retry columns"
```

(Replace `00XX_*` with the real generated filename.)

---

### Task 2: Snapshot freeze on payment

**Files:**
- Modify: `src/contexts/nutrition/kernel.ts`, `src/contexts/nutrition/actions.ts`
- Test: extend `src/contexts/nutrition/__tests__/relocation-schema.test.ts` (pure) + DB-backed test in same `__tests__` dir following `diet-document.test.ts` lines 130–194 (disposable DB pattern)

**Interfaces:**
- Consumes: `clinicalRegistries` row, `markDietClaimPaid(claimId)` from `actions.ts`
- Produces: `freezeRegistrySnapshotForUser(userId, { dbc })` used by Task 6b step-5 wrapper

- [ ] **Step 1: Add pure snapshot helper to `kernel.ts`**

```ts
export const SNAPSHOT_COLUMNS = [
  "personInfo", "medicalHistory", "drugHistory", "addictionHistory",
  "nutritionInfo", "cardiovascularQuestions", "anthropometric", "medicalDocuments",
] as const;

export function toSnapshotValues(registry: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(SNAPSHOT_COLUMNS.map((c) => [c, registry[c] ?? null]));
}
```

- [ ] **Step 2: Test the pure helper (append to relocation-schema.test.ts)**

```ts
import { toSnapshotValues } from "../kernel";

test("toSnapshotValues picks exactly the 8 sections, nulling gaps", () => {
  expect(toSnapshotValues({ personInfo: { a: 1 }, extra: true })).toEqual({
    personInfo: { a: 1 }, medicalHistory: null, drugHistory: null,
    addictionHistory: null, nutritionInfo: null, cardiovascularQuestions: null,
    anthropometric: null, medicalDocuments: null,
  });
});
```

Run: `bun run test src/contexts/nutrition/__tests__/relocation-schema.test.ts` — PASS (3 tests).

- [ ] **Step 3: Add `freezeRegistrySnapshotForUser` to `actions.ts`, hook into `markDietClaimPaid`**

```ts
export async function freezeRegistrySnapshotForUser(userId: string, opts?: { dbc?: typeof db }) {
  const dbc = opts?.dbc ?? db;
  const paidClaims = await dbc
    .select({ id: dietClaims.id })
    .from(dietClaims)
    .where(and(eq(dietClaims.userId, userId), eq(dietClaims.status, "paid")));
  const [registry] = await dbc.select().from(clinicalRegistries).where(eq(clinicalRegistries.userId, userId));
  if (!registry || paidClaims.length === 0) return { ok: true as const, frozen: 0 };
  let frozen = 0;
  for (const claim of paidClaims) {
    const values = { id: randomUUID(), claimId: claim.id, ...toSnapshotValues(registry) };
    try {
      await dbc.insert(registrySnapshots).values(values);
      frozen += 1;
    } catch {
      // unique(claim_id) already frozen — idempotent, skip
    }
  }
  return { ok: true as const, frozen };
}
```

Imports to add in `actions.ts`: `registrySnapshots` (schema import line 7), `toSnapshotValues` (kernel import — check the existing kernel import line and extend it). In `markDietClaimPaid`, after the `update ... set({ status: "paid" })` line, add: `await freezeRegistrySnapshotForUser(user.id, { dbc });`. `randomUUID` is already imported in actions.ts (used by `claimDietProgram`).

- [ ] **Step 4: DB-backed freeze test** — new file `src/contexts/nutrition/__tests__/snapshot-freeze.test.ts`, copying the disposable-DB `beforeAll` block from `diet-document.test.ts` lines 130–194 verbatim (same `SKIP` guard, `migrate` from the migrator, `drizzle(testClient, { schema })`). Seed: one user, one `clinicalRegistries` row with `personInfo: { fullName: "تست" }`, one `paid` claim. Then:

```ts
test("freeze copies the 8 sections onto paid claims, idempotent on re-run", async () => {
  if (!ready) return;
  const first = await freezeRegistrySnapshotForUser(userId, { dbc: testDb });
  expect(first.frozen).toBe(1);
  const second = await freezeRegistrySnapshotForUser(userId, { dbc: testDb });
  expect(second.frozen).toBe(0);
  const [snap] = await testDb.select().from(schema.registrySnapshots).where(eq(schema.registrySnapshots.claimId, paidClaimId));
  expect(snap.personInfo).toEqual({ fullName: "تست" });
});
```

(mock `requireUser` exactly like `diet-document.test.ts` lines ~100–120 do — read that block first; `freezeRegistrySnapshotForUser` takes userId directly so no auth mock is needed for it, but `markDietClaimPaid` needs the mock.) Also assert: user with no registry row → `{ ok: true, frozen: 0 }` and claim still `paid`.

Run: `bun run test src/contexts/nutrition/__tests__/snapshot-freeze.test.ts` — PASS with `DATABASE_URL` set; SKIP-guard passes without DB.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/nutrition/kernel.ts src/contexts/nutrition/actions.ts src/contexts/nutrition/__tests__/relocation-schema.test.ts src/contexts/nutrition/__tests__/snapshot-freeze.test.ts
git commit -m "feat(nutrition): freeze registry snapshot on payment"
```

---

### Task 3: Generation lands in `needs_review`, retry counter, `failed`

**Files:**
- Modify: `src/contexts/nutrition/actions.ts`, `src/contexts/nutrition/kernel.ts`
- Test: modify `src/contexts/nutrition/__tests__/diet-document.test.ts`, `src/contexts/nutrition/__tests__/claim-gate.test.ts` (read first, update only what breaks)

**Interfaces:**
- Consumes: `generateProgramDocument(claimId, { dbc })` (same signature)
- Produces: `needs_review` / `failed` statuses + `retryCount` for Task 5 admin actions

- [ ] **Step 1: Add pure transition guard to `kernel.ts`**

```ts
export const CLAIM_STATUSES = ["pending", "paid", "generating", "needs_review", "ready", "failed"] as const;

export function nextGenerationStatus(opts: { ok: boolean; retryCount: number }): "needs_review" | "generating" | "failed" {
  if (opts.ok) return "needs_review";
  return opts.retryCount + 1 >= 3 ? "failed" : "generating";
}
```

- [ ] **Step 2: Test it (append to relocation-schema.test.ts)**

```ts
import { nextGenerationStatus } from "../kernel";

test("generation transitions: success→review, <3 fails→retry, 3rd→failed", () => {
  expect(nextGenerationStatus({ ok: true, retryCount: 0 })).toBe("needs_review");
  expect(nextGenerationStatus({ ok: false, retryCount: 0 })).toBe("generating");
  expect(nextGenerationStatus({ ok: false, retryCount: 2 })).toBe("failed");
});
```

Run: `bun run test src/contexts/nutrition/__tests__/relocation-schema.test.ts` — PASS.

- [ ] **Step 3: Rewire `generateProgramDocument`** — three edits in `actions.ts` lines 151–207: (a) existing-doc branch: return `{ ok: true }` WITHOUT touching status (delete the flip-to-ready); (b) success tx sets `status: "needs_review"` instead of `"ready"`; (c) catch block: `await dbc.update(dietClaims).set({ status: nextGenerationStatus({ ok: false, retryCount: claim.retryCount ?? 0 }), retryCount: (claim.retryCount ?? 0) + 1 }).where(...)` — this requires selecting `retryCount` in the claim query (extend the select on line 155–157).

- [ ] **Step 4: Update the two existing test files.** Read `diet-document.test.ts` lines 1–119 first (mock setup: `mockedGenerateText`, `mockedRequireUser`, `fakeDbc`). Changes: the existing-doc test (lines ~115–127) must now expect NO status update (`updates.some(u => u.table === schema.dietClaims)` → false); success test expects `needs_review`; add failure test (mock `generateText` reject → status `generating`, `retryCount` 1; preset 2 → `failed`). In `claim-gate.test.ts`, update any assertion on post-generation `ready` to `needs_review`.

Run: `bun run test src/contexts/nutrition/__tests__/` — all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/nutrition/kernel.ts src/contexts/nutrition/actions.ts src/contexts/nutrition/__tests__/diet-document.test.ts src/contexts/nutrition/__tests__/claim-gate.test.ts src/contexts/nutrition/__tests__/relocation-schema.test.ts
git commit -m "feat(nutrition): generation lands in needs_review, 3-strike failed"
```

---

### Task 4: Claim carries org context + frozen price; profile claim list query

**Files:**
- Modify: `src/contexts/nutrition/actions.ts` (`claimDietProgram`), `src/contexts/nutrition/queries.ts` (new `myDietClaims`)
- Test: DB-backed, new `src/contexts/nutrition/__tests__/claim-org.test.ts` (same disposable-DB pattern)

**Interfaces:**
- Consumes: `dietPrograms.price`, wizard step-3 selection (Task 6b passes it through)
- Produces: `myDietClaims(userId)` → `[{ claimId, programId, programName, status, pricePaid, hasDocument }]` for Task 6b profile list

- [ ] **Step 1: Extend `claimSchema` + insert in `claimDietProgram`**

```ts
const claimSchema = z.object({
  programId: z.string().min(1),
  organizationContext: z.enum(["banks", "universities", "health_centers", "clinics", "other"]).nullish(),
});
```

Parse both fields from the FormData (`input.get("organizationContext")` may be null → nullish handles it). Fetch the program's `price` (extend the select on line 107 to include `price`), insert `{ id, userId, programId, status: "pending", organizationContext: parsed.data.organizationContext ?? null, pricePaid: program.price }`.

- [ ] **Step 2: Add `myDietClaims` to `queries.ts`** (server-only + `cache()` like neighbors):

```ts
export const myDietClaims = cache(async (userId: string) => {
  const rows = await db
    .select({
      claimId: dietClaims.id,
      programId: dietClaims.programId,
      programName: dietPrograms.name,
      status: dietClaims.status,
      pricePaid: dietClaims.pricePaid,
      organizationContext: dietClaims.organizationContext,
      createdAt: dietClaims.createdAt,
      documentId: dietDocuments.id,
    })
    .from(dietClaims)
    .innerJoin(dietPrograms, eq(dietClaims.programId, dietPrograms.id))
    .leftJoin(dietDocuments, eq(dietDocuments.claimId, dietClaims.id))
    .where(eq(dietClaims.userId, userId))
    .orderBy(desc(dietClaims.createdAt));
  const overlaid = await localizedRows("diet_program",
    rows.map((r) => ({ id: r.programId, name: r.programName, description: null })),
    "fa", ["name"]);
  // NOTE: locale is hardcoded fa here — Task 6b passes real locale; change signature to (userId, locale) and forward it.
  return rows.map((r) => ({ ...r, programName: overlaid.find((o) => (o as { id: string }).id === r.programId)?.name ?? r.programName, hasDocument: r.documentId !== null }));
});
```

Write the signature as `myDietClaims(userId: string, locale: string)` from the start (forward `locale` to `localizedRows`). Import `dietDocuments`, `desc` (desc already imported line 3; add `dietDocuments` to the schema import line 5).

- [ ] **Step 3: DB-backed test** (`claim-org.test.ts`, disposable-DB pattern): seed program price `"890000"`; insert claim via `claimDietProgram`? It calls `requireUser` — mock it exactly like `diet-document.test.ts` does (read lines 1–119 first). Assert: stored `organizationContext === "banks"`, `pricePaid` equals program price; duplicate claim (same user+program, status pending) → `{ ok: false, reason: "already_claimed" }`; `myDietClaims` returns the row with `hasDocument: false`.

Run: `bun run test src/contexts/nutrition/__tests__/claim-org.test.ts` — PASS (or SKIP-guard without DB).

- [ ] **Step 4: Commit**

```bash
git add src/contexts/nutrition/actions.ts src/contexts/nutrition/queries.ts src/contexts/nutrition/__tests__/claim-org.test.ts
git commit -m "feat(nutrition): claim org context + frozen price, myDietClaims query"
```

---

### Task 5: Admin claim queue + actions

**Files:**
- Modify: `src/contexts/nutrition/actions.ts` (5 admin actions), `src/contexts/nutrition/kernel.ts` (`allowedClaimTransition`)
- Create: `src/app/[locale]/admin/diet-programs/claims/page.tsx`
- Test: kernel unit in relocation-schema.test.ts + DB-backed `claim-admin.test.ts` (mock `requireAdmin` the way the existing file mocks `requireUser` — read lines 1–119 of diet-document.test.ts first and mirror the mock for `@/contexts/identity/actions`)

**Interfaces:**
- Consumes: Task 3 statuses; admin guard `requireAdmin` from `@/contexts/identity/actions`
- Produces: queue page; no downstream deps

- [ ] **Step 1: Transition guard in `kernel.ts` + test**

```ts
const ADMIN_TRANSITIONS: Record<string, string[]> = {
  generating: ["generating"],          // retry stays
  needs_review: ["ready", "generating"], // approve, or request-changes (back to generating)
  failed: ["generating", "ready"],     // retry, or force-publish after manual edit
  paid: ["generating"],                // manual kick when auto never ran
};

export function allowedClaimTransition(from: string, to: string): boolean {
  return ADMIN_TRANSITIONS[from]?.includes(to) ?? false;
}
```

Test: approve path true (`needs_review→ready`), patient-facing jumps false (`pending→ready`, `ready→paid`).

- [ ] **Step 2: Five admin actions in `actions.ts`** (each: `await requireAdmin()`, load claim by id (any user), guard with `allowedClaimTransition`, return `{ok}` / `{ok:false, reason}`):

```ts
export async function approveClaim(claimId: string) // needs_review → ready
export async function retryClaimGeneration(claimId: string) // generating|failed|paid → generating (reset retryCount to 0), then call generateProgramDocument WITHOUT user scope…
```

PROBLEM: `generateProgramDocument` enforces `eq(dietClaims.userId, user.id)` — admin retrying another user's claim fails the lookup. Fix inside this task: add optional `opts.skipOwnership` … NO — simpler and safer: extract the generation core. Change `generateProgramDocument(claimId, opts)` to resolve ownership as `opts.ownerId ?? (await requireUser()).id`, and `retryClaimGeneration` passes the claim's own `userId` after `requireAdmin()`. Same for `requestClaimChanges(claimId, note)` (→ generating + note stored where? — FIRST read `(account)/profile/messages/page.tsx` and find its source table/query; reuse that insert, do not invent a table; if it reads from support tickets, file the note there with `claimId` in the body), `saveDocumentBody(claimId, markdown)` (update `dietDocuments.bodyMarkdown`; allowed only when status is `needs_review` or `failed`), `cancelClaim(claimId)` (→ set status `completed` with `pricePaid` kept for the ledger note; wallet refund itself is out of scope — record only, say so in the returned message and the UI).

- [ ] **Step 3: DB-backed tests** (`claim-admin.test.ts`): approve flips `needs_review→ready`; approve on `paid` → `invalid_status`; retry resets counter and lands `needs_review` on mocked AI success; `saveDocumentBody` on `ready` → rejected. (Mock AI + requireAdmin per the file's existing mock block.)

- [ ] **Step 4: Queue page** `admin/diet-programs/claims/page.tsx`: server component, `requireAdmin()` (import from identity actions — admin pages are server components so direct call is fine), table rows from a new `allClaims()` query (add to queries.ts: join claims+programs+users name, order by createdAt desc, limit 100 — `ponytail: no pagination, add when queue exceeds 100`). Columns: claimant, program, org context, price paid (Persian digits via `toPersianDigits`), status chip, age, actions as individual `<form action={...}>` posts with hidden claimId (same pattern as diet page lines 180–195). Snapshot view: expandable `<details>` rendering the `registrySnapshots` row JSON (readable Persian labels out of scope — raw JSON in `<pre dir="ltr">`). New locale keys under `admin.dietPrograms.claims.*` in fa + en + ar.

Run: `bunx tsc --noEmit` + `bun run test src/contexts/nutrition/__tests__/` — green.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/nutrition/kernel.ts src/contexts/nutrition/actions.ts src/contexts/nutrition/queries.ts "src/app/[locale]/admin/diet-programs/claims/page.tsx" src/contexts/nutrition/__tests__/claim-admin.test.ts src/contexts/nutrition/__tests__/relocation-schema.test.ts messages/fa.json messages/en.json messages/ar.json
git commit -m "feat(admin): diet claim queue with approve, retry, review"
```

---

### Task 6a: Move registry form → `/profile/clinical`

- [ ] **Step 1: Check the `[id]` param usage** — `grep "id" src/app/[locale]/\(account\)/registry/form/\[id\]/page.tsx` (not the locale). The page reads `id` from params; if it's only used for the registry-entry key, replace with the current user's dossier (single dossier per user per `submitRegistry` upsert). If it's load-bearing (multiple dossiers), STOP and report back — the single-dossier assumption comes from `submitRegistry`'s upsert.
- [ ] **Step 2: Move the file**

```bash
git mv "src/app/[locale]/(account)/registry/form/[id]/page.tsx" "src/app/[locale]/(account)/profile/clinical/page.tsx"
```

Then edit the moved file: `"use client"` stays; replace `use(params)` id handling with locale only; retarget `submitRegistry` import unchanged (same context). Keep all 8 stages, all strings, `account.registryForm` keys untouched.
- [ ] **Step 3: Redirect + delete** — legacy path handled in Task 7's redirect map; delete the now-empty `registry/` dir: `git rm -r` the leftover (it will hold only page.tsx — MOVE that too if it's a live entry point: read it first; if it's a stub linking to form/[id], fold its content into clinical page header and delete).
- [ ] **Step 4: Verify** — `bunx tsc --noEmit` clean.
- [ ] **Step 5: Commit**

```bash
git add -A -- "src/app/[locale]/(account)/profile/clinical" "src/app/[locale]/(account)/registry"
```

NO — enumerated only (global constraint). Stage the two known paths explicitly:

```bash
git add "src/app/[locale]/(account)/profile/clinical/page.tsx"
git add -u "src/app/[locale]/(account)/registry"
git commit -m "refactor(profile): registry form lives at /profile/clinical"
```

---

### Task 6b: Public diet wizard + `/profile/diets`

**Files:**
- Create: `src/app/[locale]/(diet)/diet/page.tsx` (steps 1–3, public), `.../diet/payment/page.tsx` (step 4, `requireUser`), `.../diet/check/page.tsx` (step 5, `requireUser`), `src/app/[locale]/(account)/profile/diets/page.tsx`, `src/app/[locale]/(account)/profile/diets/[id]/page.tsx`
- Modify: none (old diet pages die in Task 7)
- Queries: `getRegistryStatus(userId)` → `{ complete: boolean, missingSections: string[] }` (`submittedAt != null` = complete; missing = the 8 columns that are null) in queries.ts, cached + server-only

**Interfaces:**
- Consumes: `listPrograms`, `myDietClaims`, `claimDietProgram`, `markDietClaimPaid`, `freezeRegistrySnapshotForUser`, `getRegistryStatus` (all exist after Tasks 2–4)
- Step state travels via `pending` claim row + URL (`?program=&org=&step=`); no client state, no cookies

- [ ] **Step 1: `getRegistryStatus` + test** — pure completeness check on the 8 columns; DB-backed test optional (covered implicitly); at minimum unit-test the missing-sections logic via kernel: add `missingRegistrySections(row: Record<string, unknown>): string[]` to kernel.ts filtering `SNAPSHOT_COLUMNS` nulls, test in relocation-schema.test.ts.
- [ ] **Step 2: Wizard steps 1–3 (public)** — single `diet/page.tsx` reading `?step=&program=&org=`: step 1 renders the 18 categories — SOURCE: `dietPrograms.planType` distinct values via existing `listPrograms`? `listPrograms(context)` filters by org context. For step 1 use a new `listProgramTypes()` query (select distinct planType) — add it, cached. Step 2 lists programs of that type with tiers/prices (reuse program cards from the old diet page, copy markup). Step 3 org picker (5 `CONTEXT_DEFS` options incl. "بدون سازمان", copy from old page) with live price preview (tier price, no discount math — price shown = program.price; org recorded for insurance, discounts out of scope — say so on screen in one line).
- [ ] **Step 3: Step 4 payment (`diet/payment/page.tsx`, `requireUser`)** — review card (program, tier, org, price from claim's `pricePaid` AFTER creating the pending claim via `claimDietProgram` form post on step 3 → redirect here with `?claim=`). Confirm button calls `markDietClaimPaid` (existing offline-confirm semantics) → redirect to check step. New `fa` keys `dietWizard.*`.
- [ ] **Step 4: Step 5 check (`diet/check/page.tsx`, `requireUser`)** — `getRegistryStatus`: complete → auto-redirect to `/profile/diets/[claim]`; else render ONLY the missing sections: reuse the stage components from the clinical form? The clinical form is one 869-line client component with internal stage state — NOT reusable per-stage. Pragmatic call: link out to `/profile/clinical` with `?return=/diet/check?claim=` and on return, if complete, backfill via page-level server wrapper:

```ts
// in diet/check/page.tsx
async function submitAndBackfill(payload: Record<string, unknown>) {
  "use server";
  const { submitRegistry } = await import("@/contexts/identity/actions");
  const r = await submitRegistry(payload);
  if (r.ok) {
    const user = await requireUser();
    await freezeRegistrySnapshotForUser(user.id);
  }
  return r;
}
```

(Page files may import both contexts — no cycle, pages are leaves.) After complete → redirect to status page.
- [ ] **Step 5: `/profile/diets` list + `[id]` status** — list from `myDietClaims(user.id, locale)`: status chips (`pending → paid → generating → needs_review → ready`, `failed` with retry button calling `generateProgramDocument`), price paid, org. Detail page: timeline, frozen banner ("edits to your profile don't affect this program"), document render when `ready` (markdown as plain text blocks — check how the old `diet/[id]` page renders `bodyMarkdown` and copy it), retry button when `failed`/`generating`-stale.
- [ ] **Step 6: Verify** — `bunx tsc --noEmit` + `bun run test src/contexts/nutrition/__tests__/` green.
- [ ] **Step 7: Commit** (enumerate every created file explicitly).

---

### Task 6c: Calorie + body → profile, public calculator, hub

- [ ] **Step 1: Move calorie**

```bash
git mv "src/app/[locale]/(nutrition)/calorie" "src/app/[locale]/(account)/profile/calorie"
```

Fix relative imports if any (grep `from "@` — absolute, likely zero changes). `createPeriod`, `logIntake`, period queries unchanged.
- [ ] **Step 2: Body → `/profile/body`** — move `(nutrition)/body/page.tsx` content minus the calculator half: keep BMI display + profile form, add weigh-ins log (form posts to new `logWeight` action in nutrition/actions.ts: zod `{ weightKg: 25–300, loggedAt: yyyy-mm-dd }`, insert into `weightLogs` with `randomUUID`), chart = `weightHistory(userId)` query (queries.ts, cached: select from `weightLogs` order asc, limit 60 — `ponytail: server-side SVG chart later; simple list + min/max/avg line via divs`) rendered as a plain list with Jalali dates + min/max/current summary. `logWeight` also upserts `physiologyProfiles.weightKg` (today's truth stays in sync).
- [ ] **Step 3: `/calculator` public page** — new `src/app/[locale]/(marketing or discovery)/calculator/page.tsx`: reuse `MetabolismCalculator` from `@/components/clinical` (check its props first — read the file head; if it needs auth data, wrap with defaults). Ends with signup CTA (`/signin`). Check where public pages live: foods is in `(discovery)` — put calculator there: `(discovery)/calculator/page.tsx`.
- [ ] **Step 4: Profile hub** — check for `(account)/profile/page.tsx` (listing showed only subdirs — it does NOT exist). Create it: identity summary (existing personal-info query — read that page and reuse), my-diets compact list (`myDietClaims` top 3), active calorie summary (latest period + entry count via `listPeriods`), body snapshot (latest weight). Cards link out. One primary CTA: continue-the-funnel (pending claim → wizard step; else new diet).
- [ ] **Step 5: Verify** — `bunx tsc --noEmit` clean.
- [ ] **Step 6: Commit** (enumerate moved + created files).

---

### Task 7: Redirects, delete `(nutrition)`, locale purge

- [ ] **Step 1: Find the legacy-redirect mechanism** — `grep -rn "food-analysis\|offline-diet\|meal-type\|diary" next.config.* src/proxy.ts` — extend WHATEVER mechanism the old nutrition deletions used (proxy 307 or next.config redirects). Add: `/nutrition/calorie*` → `/profile/calorie*`, `/nutrition/body` → `/profile/body`, `/nutrition/diet*` → `/diet*` (wizard) — PLUS `/nutrition/diet/:id` claimed → can't know claim state at edge: send to `/profile/diets` list (one extra click, correct in all states — say so in code comment), `/registry/form/*` → `/profile/clinical`, `/nutrition` → `/profile`.
- [ ] **Step 2: Delete the group** — `git rm -r "src/app/[locale]/(nutrition)"` ONLY after 6a–6c merged (verify no imports reference it: `grep -rn "(nutrition)" src --include=*.tsx --include=*.ts` → zero hits first).
- [ ] **Step 3: Locale keys** — move keys with their components; `grep` `messages/fa.json` for keys no longer referenced (`diary`, `food-analysis`, `meal-type`, old diet listing keys) and delete across fa/en/ar (same purge procedure as the 87-key purge: delete key in all three files together).
- [ ] **Step 4: Verify** — `bunx tsc --noEmit`, `bun run lint`, `bun run test`, `bun run build` (build must list the new routes; grep build output for `/profile/diets`, `/diet`, `/calculator`).
- [ ] **Step 5: Commit**

---

### Task 8: `weight_log` UI wiring test + backfill verification

- [ ] **Step 1: Test `logWeight` + `weightHistory`** — DB-backed `weight-log.test.ts` (disposable pattern): log 3 weights out of order → history asc; invalid (400kg) → zod error, no insert; physiology weight synced.
- [ ] **Step 2: Backfill verification** — after Task 1 migration runs on dev DB: `SELECT count(*) FROM weight_log` equals physiology row count (one row per user). If the `ON CONFLICT` clause was dropped (Task 1), run it once manually and eyeball the count.
- [ ] **Step 3: Commit**

```bash
git add src/contexts/nutrition/actions.ts src/contexts/nutrition/queries.ts src/contexts/nutrition/__tests__/weight-log.test.ts "src/app/[locale]/(account)/profile/body/page.tsx"
git commit -m "test(nutrition): weight log actions, history, backfill check"
```

(NOTE: actions/queries/body-page were built in 6c; this task only ADDS the test + verifies backfill. If 6c already committed them, stage only the test file.)

---

### Task 9: Full verification + e2e handoff

- [ ] **Step 1: Run the gate** — `bunx tsc --noEmit` (0), `bun run lint` (0 errors; the two accepted no-await-in-loop warnings may become three — nutrition actions has one already), `bun run test` (all green), `bun run build` (new routes present).
- [ ] **Step 2: E2E rewrite list (do NOT run — needs seeded dev server + human)** — rewrite `e2e/nutrition.spec.ts`: `/nutrition/*` → new routes; add wizard happy path (type→tier→org→pending claim), admin approve path flagged manual (needs admin session + AI key). Write the spec-file diffs, mark the run as HUMAN step in the plan tracker.
- [ ] **Step 3: Migration dry-run** — `bun run db:generate` outputs NOTHING new (schema == migrations); if it emits a diff, the migration in Task 1 drifted — fix before merge.
- [ ] **Step 4: Commit** e2e changes only.

---

## Self-review

- **Spec coverage:** §1 routes → 6a/6b/6c/7 ✓; §2 snapshot → T2 ✓, statuses → T3 ✓, org≠type → T4 (as enum column — deviation declared) ✓, weigh_ins → weight_log reuse (deviation declared) ✓; §3 wizard → 6b ✓ (payment auth wall, resumable pending, failure paths incl. frozen-banner); §4 admin → T5 ✓ (all five actions + audit via existing tables); §5 migration order + tests → T1/T9 ✓, UX law → global constraints ✓.
- **Placeholder scan:** no TBD/TODO; every test step names the exact file + pattern source (`diet-document.test.ts` lines cited); `00XX` is a fill-in-at-generate-time filename, unavoidable and flagged.
- **Type consistency:** `freezeRegistrySnapshotForUser(userId, { dbc })` named identically in T2/T4-interface/T6b; `myDietClaims(userId, locale)` same in T4/T6b; `needs_review` string identical everywhere; `SNAPSHOT_COLUMNS` shared by T2 helper + 6b completeness check.
- **Fixes applied inline:** org FK → enum column; weigh_ins → weight_log; `requestClaimChanges` note target resolved via explicit read-first step instead of invented table; 6c/8 double-commit risk noted in T8.
