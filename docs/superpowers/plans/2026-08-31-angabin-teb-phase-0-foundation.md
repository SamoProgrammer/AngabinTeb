# Angabin Teb — Phase 0: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the skeleton every later phase depends on: project scaffold, database + migrations, phone-OTP authentication, trilingual RTL interface shell, and the admin console.

**Architecture:** One Next.js 16 app (App Router, Server Components, Server Actions) over one Postgres 17 database via Drizzle ORM. Auth is Better Auth with its `phoneNumber` plugin. i18n is next-intl with a root `[locale]` segment (`fa` default, `en`, `ar`), RTL via logical CSS properties. Locale negotiation runs in `proxy.ts` (manual, not next-intl middleware — see spec §8 integration risk). Persian is the base language for stored data; the polymorphic `translation` table holds non-Persian overrides (spec §5.5/5.6).

**Tech Stack:** Next.js 16.3.x · React 19.2 · TypeScript 7.0.2 · Tailwind CSS v4.3 · Drizzle ORM 0.45.x + `postgres` driver · Better Auth 1.6+ · next-intl v4 · Zod · Oxlint · Prettier · Vitest · Docker Compose (`postgres:17`) · bun.

**Spec:** `docs/superpowers/specs/2026-08-31-angabin-teb-design.md`

## Global Constraints

Copied verbatim from the spec — every task implicitly includes these.

1. **Node 24 LTS** runtime; Next.js 16 requires ≥ 20.9.
2. **Next 16.3.x**: Turbopack default (`next dev`/`next build`, no webpack config); `middleware.ts` is now **`proxy.ts`** with a named `proxy` export; `cookies()`, `headers()`, `params`, `searchParams` are **async only**; `next lint` does not exist.
3. **TypeScript 7.0.2**: no JS compiler API. **No `typescript-eslint`** — use **Oxlint** (`oxlint`). Never alias TS 6 unless type-aware linting is demanded.
4. **Proxy-only authz is bypassable** (CVE-2025-29927). `proxy.ts` does locale negotiation and optimistic redirects only. Every protected page and every Server Action re-verifies the session server-side.
5. **Tailwind v4.3**: CSS-first config via `@theme` in `globals.css`. No `tailwind.config.js`. RTL via logical properties (`ms-/me-`, `ps-/pe-`, `text-start/end`).
6. **Drizzle ORM 0.45.x stable** (not 1.0 RC). Driver: `postgres` (postgres.js). `dialect: "postgresql"` in `drizzle.config.ts`.
7. **Better Auth** (not Auth.js). Phone-first OTP via the `phoneNumber` plugin. Sessions in Postgres.
8. **next-intl v4** with root `[locale]` segment; `fa` is default locale, then `en`, `ar`. `fa`/`ar` → `dir="rtl"`, `en` → `dir="ltr"`.
9. **Persian is the source of truth for stored data.** Translatable entities keep a base Persian column; `translation` rows hold non-Persian overrides only (spec §5.6).
10. **DB correctness over app locking** (spec §5.3): partial unique index on `appointment(slot_id)` where status not in ('cancelled','no_show'); unique index on `idempotency_key`; conditional `UPDATE availability_slot` for capacity.
11. **Contexts talk through public interfaces only** (spec §4.1): `src/contexts/<context>/{kernel,queries,actions,model}.ts`.
12. **shadcn/ui (vendored Radix)** for interactive primitives; no component library dependency, no TanStack, no RHF, no client state library.
13. Browser floor: Chrome/Edge 111+, Firefox 111+, Safari 16.4+.
14. Package manager: **bun**. Every code change ends with a commit (repo is `git init`-ed in Task 0.1). Scripts run via `bun run <script>`; dev deps install with `bun add -d`.

## File Map

```
<repo root>/
  package.json  next.config.ts  tsconfig.json  postcss.config.mjs
  drizzle.config.ts  docker-compose.yml  vitest.config.ts
  .oxlintrc.json  .prettierrc  playwright.config.ts (Phase 1)
  src/
    proxy.ts
    db/
      index.ts            # postgres client + drizzle instance
      schema/index.ts     # barrel
      schema/identity.ts  # user, session, account, verification
      schema/platform.ts  # translation
      migrations/
    lib/
      sms.ts
      auth.ts
      translate.ts
    i18n/
      locales.ts
      request.ts
    app/
      api/auth/[...all]/route.ts
      [locale]/layout.tsx
      [locale]/page.tsx
      [locale]/admin/layout.tsx
      [locale]/admin/page.tsx
    components/ui/        # shadcn: button, card, input, table, select, badge
    contexts/identity/{model.ts,actions.ts}
  messages/{fa,en,ar}.json
  scripts/seed.ts
  docker-compose.yml
```

---

### Task 0.1: Scaffold the Next.js app and init git

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (all generated)

**Interfaces:**
- Consumes: nothing
- Produces: a booting Next.js 16 app the remaining tasks build into

- [ ] **Step 1: Scaffold into a temp dir (repo root is not empty — it holds the spec and docs/)**

```bash
cd C:\Users\Samo\AppData\Local\Temp\opencode
bunx create-next-app@latest at-scaffold --ts --tailwind --app --src-dir --use-bun --yes
```

Expected: scaffold completes with Next.js 16.3.x and Tailwind v4. No `--eslint` flag (ruling R1: eslint-config-next pulls typescript-eslint, which breaks under TS 7 — Oxlint covers linting from Task 0.2). Report the scaffolded `next`, `react`, `typescript`, `tailwindcss` versions from `package.json` in the task report.

- [ ] **Step 2: Move scaffold contents into the repo root**

```powershell
Copy-Item -Recurse -Force C:\Users\Samo\AppData\Local\Temp\opencode\at-scaffold\* E:\Programming\AngabinTeb\
Remove-Item -Recurse -Force C:\Users\Samo\AppData\Local\Temp\opencode\at-scaffold
```

- [ ] **Step 3: Init git and commit the scaffold**

```bash
git init -b main
git add -A
git commit -m "chore: scaffold Next.js 16 app"
```

- [ ] **Step 4: Verify the dev server boots**

Run: `bun run dev`
Expected: http://localhost:3000 renders the default page; console shows Turbopack, no errors.

- [ ] **Step 5: Verify Tailwind v4 is present**

Check `src/app/globals.css` starts with `@import "tailwindcss";` and there is **no** `tailwind.config.js`.

---

### Task 0.2: Tooling — Oxlint, Prettier, Vitest, script aliases

**Files:**
- Create: `.oxlintrc.json`, `.prettierrc`, `vitest.config.ts`, `src/lib/__tests__/toolchain.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: scaffold from Task 0.1
- Produces: `bun run lint`, `bun run format`, `bun run test`, `bun run db:*` script aliases used by every later task

- [ ] **Step 1: Install tooling**

```bash
bun add -d oxlint prettier vitest tsx typescript@7.0.2
```

Pins TypeScript to 7.0.2 (constraint 3; the scaffold may install an older major).

- [ ] **Step 2: Add scripts**

In `package.json`:

```json
"scripts": {
  "lint": "oxlint src",
  "format": "prettier --write .",
  "test": "vitest run",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "tsx scripts/seed.ts",
  "db:studio": "drizzle-kit studio"
}
```

- [ ] **Step 3: Write the toolchain smoke test**

`src/lib/__tests__/toolchain.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `bun run test`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add oxlint, prettier, vitest, tsx"
```

---

### Task 0.3: Postgres + Drizzle foundation

**Files:**
- Create: `docker-compose.yml`, `drizzle.config.ts`, `src/db/index.ts`, `src/db/schema/index.ts`, `src/db/schema/identity.ts`, `src/db/schema/platform.ts`, `.env` (local only, gitignored)

**Interfaces:**
- Consumes: bun + tsx from Task 0.2
- Produces: `db` (drizzle instance), `users`, `sessions`, `accounts`, `verifications`, `translations` tables; `DATABASE_URL` convention `postgres://angabin:angabin@localhost:5432/angabin`

- [ ] **Step 1: Write docker-compose.yml**

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: angabin
      POSTGRES_PASSWORD: angabin
      POSTGRES_DB: angabin
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

- [ ] **Step 2: Start Postgres**

Run: `docker compose up -d`
Expected: `docker compose ps` shows `db` healthy.

- [ ] **Step 3: Install Drizzle**

```bash
bun add drizzle-orm postgres
bun add -d drizzle-kit dotenv
```

(`@types/pg` dropped — ruling R3: the `postgres` driver ships its own types; nothing imports `pg`.)

- [ ] **Step 4: Write drizzle.config.ts**

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
});
```

- [ ] **Step 5: Write the connection module**

`src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { max: 5 });
export const db = drizzle(client);
```

`.env`:

```
DATABASE_URL=postgres://angabin:angabin@localhost:5432/angabin
```

- [ ] **Step 6: Write the identity schema**

`src/db/schema/identity.ts`:

```ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified").default(false),
  role: text("role").notNull().default("patient"), // patient | provider | admin
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").unique().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 7: Write the translation schema**

`src/db/schema/platform.ts`:

```ts
import { pgTable, text, primaryKey, index } from "drizzle-orm/pg-core";

export const translations = pgTable(
  "translation",
  {
    entityType: text("entity_type").notNull(), // service | provider | food | content | ...
    entityId: text("entity_id").notNull(),
    locale: text("locale").notNull(),          // fa | en | ar (fa overrides never written)
    field: text("field").notNull(),            // name | title | bio | ...
    value: text("value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.entityType, t.entityId, t.locale, t.field] }),
    index("translation_lookup").on(t.entityType, t.entityId),
  ],
);
```

- [ ] **Step 8: Barrel export and generate + apply the first migration**

`src/db/schema/index.ts`:

```ts
export * from "./identity";
export * from "./platform";
```

```bash
bun run db:generate
bun run db:migrate
```

Expected: `db:generate` emits SQL into `src/db/migrations`; `db:migrate` reports the tables created.

- [ ] **Step 9: Verify connectivity with a real query**

```bash
bunx tsx -e "import { db } from './src/db'; import { sql } from 'drizzle-orm'; const r = await db.execute(sql\`select 1 as ok\`); console.log(r[0]);"
```

Expected: `{ ok: 1 }`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: postgres + drizzle foundation, identity and translation schema"
```

---

### Task 0.4: Better Auth with phone OTP

**Files:**
- Create: `src/lib/sms.ts`, `src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts`, `src/contexts/identity/actions.ts`
- Modify: `src/db/schema/identity.ts` (already written in Task 0.3 — no change needed)

**Interfaces:**
- Consumes: `users`/`sessions`/`accounts`/`verifications` from Task 0.3
- Produces:
  - `sendSms(to: string, body: string): Promise<void>` — the one SMS function every phase swaps prod backends behind
  - `auth` (Better Auth instance) with `auth.api.getSession({ headers })`, `auth.api.signInPhoneNumber`, `auth.api.sendOtp`
  - `requireUser(): Promise<User>` and `requireAdmin(): Promise<User>` in `src/contexts/identity/actions.ts` — server-side session verification used by every protected page/action (constraint 4)

- [ ] **Step 1: Install Better Auth**

```bash
bun add better-auth
```

Note: if better-auth errors on a missing secret at first run, add `BETTER_AUTH_SECRET=<random hex>` to `.env` (dev only).

- [ ] **Step 2: Write the SMS interface**

`src/lib/sms.ts`:

```ts
export async function sendSms(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === "production" && !process.env.SMS_PROVIDER) {
    throw new Error("SMS_PROVIDER not configured in production");
  }
  // Dev: log the code so the OTP flow is verifiable without a gateway.
  console.log(`[SMS:${to}] ${body}`);
}
```

- [ ] **Step 3: Write the auth instance**

`src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendSms } from "@/lib/sms";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendSms(phoneNumber, `Angabin Teb: code ${code}`);
      },
    }),
  ],
});
```

- [ ] **Step 4: Wire the route handler**

`src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 5: Write the session guards**

`src/contexts/identity/actions.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/signin`);
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
```

- [ ] **Step 6: Unit test the OTP send path**

`src/lib/__tests__/sms.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { sendSms } from "@/lib/sms";

describe("sendSms", () => {
  it("logs the message in dev", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendSms("09120000000", "Angabin Teb: code 123456");
    expect(spy).toHaveBeenCalledWith("[SMS:09120000000] Angabin Teb: code 123456");
    spy.mockRestore();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `bun run test`
Expected: PASS (2 tests).

- [ ] **Step 8: Verify the OTP round trip end to end**

```bash
bun run dev
```

1. `curl -X POST http://localhost:3000/api/auth/phone-number/send-otp -H "content-type: application/json" -d '{"phoneNumber":"09120000000"}'`
2. Read the code from the server log (`[SMS:09120000000] Angabin Teb: code 123456`)
3. `curl -X POST http://localhost:3000/api/auth/sign-in/phone-number -H "content-type: application/json" -d '{"phoneNumber":"09120000000","code":"123456"}'`
Expected: response sets a session cookie and returns a user with role `patient`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: better-auth phone OTP auth with session guards"
```

---

### Task 0.5: i18n + RTL shell

**Files:**
- Create: `src/i18n/locales.ts`, `src/i18n/request.ts`, `messages/fa.json`, `messages/en.json`, `messages/ar.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/components/locale-switcher.tsx`, `src/proxy.ts`
- Delete: `src/app/page.tsx` (root page; routes live under `[locale]`) and `src/app/layout.tsx` (ruling R4: its `<html>`/`<body>` moves into `[locale]/layout.tsx`; keeping both is a two-root-layout build error)
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: nothing beyond scaffold
- Produces: `getLocale()` / `getMessages()` via next-intl; `proxy.ts` named export doing locale negotiation; route prefix `/fa` `/en` `/ar`; `LocaleSwitcher` client component

- [ ] **Step 1: Install next-intl**

```bash
bun add next-intl
```

- [ ] **Step 2: Write locale constants + request config**

`src/i18n/locales.ts` (ruling R7: standalone module so `proxy.ts` never pulls `next-intl/server` into the edge runtime):

```ts
export const locales = ["fa", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";
```

`src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./locales";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = (locales as readonly string[]).includes(requested ?? "")
    ? (requested as Locale)
    : defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Write message catalogs**

`messages/fa.json`:

```json
{
  "nav": { "home": "خانه", "doctors": "پزشکان", "services": "خدمات", "admin": "مدیریت" },
  "home": { "heroTitle": "انگبین طب", "heroSubtitle": "مراقبت، تغذیه و دانش سلامت" },
  "locale": { "switch": "تغییر زبان" }
}
```

`messages/en.json`:

```json
{
  "nav": { "home": "Home", "doctors": "Doctors", "services": "Services", "admin": "Admin" },
  "home": { "heroTitle": "Angabin Teb", "heroSubtitle": "Care, nutrition and health knowledge" },
  "locale": { "switch": "Change language" }
}
```

`messages/ar.json`:

```json
{
  "nav": { "home": "الرئيسية", "doctors": "الأطباء", "services": "الخدمات", "admin": "الإدارة" },
  "home": { "heroTitle": "انگبین طب", "heroSubtitle": "الرعاية والتغذية والمعرفة الصحية" },
  "locale": { "switch": "تغيير اللغة" }
}
```

- [ ] **Step 4: Enable the plugin**

`next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Write the locale layout with RTL**

`src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { locales } from "@/i18n/locales";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  return (
    <html lang={locale} dir={locale === "en" ? "ltr" : "rtl"}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Write the locale switcher**

`src/components/locale-switcher.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const locales = ["fa", "en", "ar"] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: string) {
    const rest = pathname.replace(`/${locale}`, "") || "/";
    startTransition(() => router.replace(`/${next}${rest}`));
  }

  return (
    <select
      value={locale}
      disabled={isPending}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Change language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 7: Write the locale negotiation proxy**

`src/proxy.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/locales";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const accept = req.headers.get("accept-language") ?? "";
  const preferred = locales.find((l) => accept.toLowerCase().includes(l));
  const target = preferred ?? defaultLocale;
  return NextResponse.redirect(new URL(`/${target}${pathname}`, req.url));
}
```

- [ ] **Step 8: Write the home page shell**

`src/app/[locale]/page.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function HomePage() {
  const t = useTranslations();
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <header className="flex items-center justify-between">
        <nav className="flex gap-4">
          <a href="/">{t("nav.home")}</a>
          <a href="/doctors">{t("nav.doctors")}</a>
          <a href="/services">{t("nav.services")}</a>
        </nav>
        <LocaleSwitcher />
      </header>
      <h1 className="mt-16 text-5xl font-bold">{t("home.heroTitle")}</h1>
      <p className="mt-4 text-xl text-gray-600">{t("home.heroSubtitle")}</p>
    </main>
  );
}
```

- [ ] **Step 9: Verify i18n + RTL behavior**

Run: `bun run dev`
1. Visit `/` → 307 redirect to `/fa/` (default locale).
2. `/fa/` renders RTL (`<html dir="rtl" lang="fa">`), Persian copy.
3. `/en/` renders LTR, English copy; switcher flips locale without losing the path.
4. `/de/` → `notFound()`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: next-intl trilingual shell with RTL and locale proxy"
```

---

### Task 0.6: Seed pipeline — admin user + sample catalog with translations

**Files:**
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: `db`, `users`, `translations` from Task 0.3/0.4
- Produces: idempotent `bun run db:seed`; one admin user (phone `09120000000`, role `admin`); `en`/`ar` translation overrides for one provider, one `service_category`, and one service (ruling R5: base rows arrive with the Phase 1 catalog schema; the polymorphic `translation` table tolerates rows for not-yet-existing entities, spec §5.5 ceiling). Re-running never duplicates (upsert by fixed IDs).

- [ ] **Step 1: Write the seed script**

`scripts/seed.ts`:

```ts
import "dotenv/config";
import { db } from "../src/db";
import { users, translations } from "../src/db/schema";

const ADMIN_ID = "admin-seed";
const PROVIDER_ID = "prov-heart-1";
const CATEGORY_ID = "cat-cardio";
const SERVICE_ID = "svc-ecg-1";

async function upsertTranslation(entityType: string, entityId: string, locale: string, field: string, value: string) {
  await db
    .insert(translations)
    .values({ entityType, entityId, locale, field, value })
    .onConflictDoUpdate({
      target: [
        translations.entityType,
        translations.entityId,
        translations.locale,
        translations.field,
      ],
      set: { value },
    });
}

async function main() {
  await db
    .insert(users)
    .values({
      id: ADMIN_ID,
      name: "Administrator",
      phoneNumber: "09120000000",
      phoneNumberVerified: true,
      role: "admin",
    })
    .onConflictDoUpdate({ target: users.id, set: { role: "admin" } });

  // Location / provider / service base rows arrive with the Phase 1 catalog schema;
  // seed only translation overrides for now.
  await upsertTranslation("provider", PROVIDER_ID, "en", "name", "Dr. Test Cardiologist");
  await upsertTranslation("provider", PROVIDER_ID, "ar", "name", "دكتور القلب التجريبي");
  await upsertTranslation("service", SERVICE_ID, "en", "name", "ECG");
  await upsertTranslation("service", SERVICE_ID, "ar", "name", "تخطيط القلب");
  await upsertTranslation("service_category", CATEGORY_ID, "en", "name", "Cardiology");
  await upsertTranslation("service_category", CATEGORY_ID, "ar", "name", "أمراض القلب");

  console.log("seed complete");
}

main().then(() => process.exit(0));
```

- [ ] **Step 2: Add the seed script to package.json**

```json
"db:seed": "tsx scripts/seed.ts"
```

- [ ] **Step 3: Run it twice**

```bash
bun run db:seed
bun run db:seed
```

Expected: second run prints `seed complete` with no unique-violation errors and no duplicate rows (`select count(*) from "translation"` stays stable).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: idempotent seed pipeline with trilingual catalog overrides"
```

---

### Task 0.7: Admin shell with server-side authz

**Files:**
- Create: `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/admin/page.tsx`
- Modify: `src/app/[locale]/page.tsx` (admin nav link; ruling R6 — the shell's only nav lives in the home page, not the layout; the `nav.admin` message key already exists in the Task 0.5 catalogs)

**Interfaces:**
- Consumes: `requireAdmin()` from Task 0.4 (server-side check — constraint 4)
- Produces: `/fa/admin` route group; layout redirects non-admins; overview page shows live counts of users and translations from the DB

- [ ] **Step 1: Init shadcn and add the primitives used now and in Phase 1**

```bash
bunx shadcn@latest init --yes --defaults
bunx shadcn@latest add button card table input select badge --yes
```

(`--yes --defaults` keeps shadcn non-interactive; it detects Next 16 + Tailwind v4 and writes its theme variables into `src/app/globals.css`, which `[locale]/layout.tsx` already imports.)

- [ ] **Step 2: Write the admin layout with the guard**

`src/app/[locale]/admin/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { requireAdmin } from "@/contexts/identity/actions";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin(); // server-side session check; NOT proxy-only (constraint 4)
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-e p-4">
        <nav className="flex flex-col gap-2">
          <a href="/admin" className="font-semibold">Overview</a>
        </nav>
        <div className="mt-8"><LocaleSwitcher /></div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write the overview page**

`src/app/[locale]/admin/page.tsx`:

```tsx
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users, translations } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [userCount, translationCount] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(translations),
  ]);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="text-3xl font-bold">{userCount[0].n}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Translations</CardTitle></CardHeader>
        <CardContent className="text-3xl font-bold">{translationCount[0].n}</CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify authorization behavior**

Run: `bun run dev`
1. Visit `/fa/admin` logged out → redirects to `/fa/signin` (the sign-in page itself is Phase 1 scope; verify the redirect target with the OTP API flow from Task 0.4).
2. Sign in with the seeded admin phone (`09120000000` + OTP from server log) → `/fa/admin` renders the overview with counts ≥ 1.
3. Register a fresh patient via OTP, visit `/fa/admin` → redirected to `/`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: admin shell with server-side authorization"
```

---

### Task 0.8: Phase 0 exit verification

**Files:** none (verification only)

**Interfaces:** nothing produced; Phase 1 consumes everything above

**Note on spec §11:** the spec's Phase 0 exit criterion ("admin creates a provider, a service, a location in three locales") requires the catalog CRUD that ships in Phase 1 Task 1.4 — the admin console gets the create-forms there. Phase 0 closes with auth, i18n/RTL, and the admin shell working, which is the load-bearing part.

- [ ] **Step 1: Full verification pass**

```bash
docker compose up -d && bun run db:migrate && bun run db:seed && bun run test && bun run lint && bun run build
```

Expected: all green. `bun run build` completes — Turbopack production build with TS 7.0.2 (constraint 3 — this is the point where a TS 7 incompatibility would surface; if `next build` errors on the compiler API, apply the §2.4 dual-compiler alias from the spec and note it in the commit).

- [ ] **Step 2: Manual flow pass**

1. `/` → `/fa/` redirect works; `/en/` and `/ar/` render with correct `dir`.
2. Fresh phone OTP sign-in creates a `patient` user.
3. Seeded admin signs in, sees `/fa/admin` overview.
4. `bun run db:seed` re-run is idempotent.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: phase 0 exit verification"
```

---

## Phase 0 Self-Review

- **Spec coverage:** §2 (stack) — Task 0.1/0.2/0.3; §2.4 (TS7/oxlint/proxy hazards) — Global Constraints 3–4, Task 0.2; §4.2 (folder layout) — Task 0.1 onward; §5.5/5.6 (translation table + base column pattern) — Task 0.3/0.6; §8 (i18n/RTL, manual proxy negotiation per the documented risk) — Task 0.5; §9 (admin shell + authz in data layer) — Task 0.7; §11 Phase 0 — Tasks 0.1–0.8.
- **Placeholders:** none — every code step carries complete code.
- **Type consistency:** `requireUser`/`requireAdmin` (actions.ts) signatures match their call sites in admin layout; `sendSms(to, body)` matches auth plugin usage and its test; `translations` PK order `(entityType, entityId, locale, field)` matches the seed's `onConflictDoUpdate` target order; `users.role` values `patient | provider | admin` match the spec §9.