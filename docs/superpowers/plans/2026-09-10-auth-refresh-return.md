# Auth Refresh + Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phone-OTP login lasts 24h with sliding refresh + Remember-me 30d, and every auth wall returns the user to their original page after login.

**Architecture:** better-auth native session lifetimes (no new table) plus one pure return helper shared by server guards and the signin client; `proxy.ts` echoes the requested path in an `x-auth-return` header so zero-arg `requireUser()`/`requireAdmin()` can redirect with `returnUrl` without signature changes.

**Tech Stack:** Next 16 App Router, better-auth 1.7.2 (phoneNumber plugin), Drizzle/postgres.js, next-intl (fa source of truth), vitest, oxlint, bun.

**Spec:** `docs/superpowers/specs/2026-09-10-auth-refresh-return-design.md`

## Global Constraints

- `bun` only, never pnpm/npm/yarn.
- `messages/fa.json` is source of truth; `en`/`ar` are overrides.
- RTL: logical Tailwind props only (`ps/pe`, `text-start`, `ms/me`); physical (`pl/pr`, `left/right`) forbidden.
- Server Actions modules export async only; pure helpers live outside `"use server"` files.
- `proxy.ts` makes no auth decisions (locale + path echo only); every page re-verifies via `requireUser()`/`requireAdmin()`.
- `postgres.js` results expose `.count`, not `.rowCount`.
- No native `type="date"`/`datetime-local` inputs (unrelated, restated so executors don't "improve" forms they touch).
- `return.ts` must NOT contain `server-only` — it is imported by the signin client component.

---

## File Structure

- `src/contexts/identity/return.ts` (new, pure): `isSafeReturn`, `parseLocale`, `defaultDashboard`, `toSignin`, `safeReturnOrDefault`. No React, no Next imports.
- `src/contexts/identity/__tests__/return.test.ts` (new): vitest coverage for every helper.
- `src/lib/auth.ts` (modify): add `session: { expiresIn, updateAge }` in seconds.
- `src/proxy.ts` (modify): set `x-auth-return` header for guarded prefixes.
- `src/contexts/identity/actions.ts` (modify): `requireUser`/`requireAdmin` read the header, redirect via `toSignin`.
- `src/app/[locale]/(auth)/signin/page.tsx` (modify): Remember-me checkbox, `rememberMe` pass-through, validated return for OTP + both demo buttons, drop `document.cookie` mirror.
- `src/app/api-test/login/route.ts` (modify): comment only.
- `messages/{fa,en,ar}.json` (modify): one `auth.rememberMe` key each.

---

### Task 1: Pure return helper + tests

**Files:**
- Create: `src/contexts/identity/return.ts`
- Create: `src/contexts/identity/__tests__/return.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `isSafeReturn(url, locale): boolean`, `parseLocale(echoed): string`, `defaultDashboard(locale): string`, `toSignin(locale, returnTo): string`, `safeReturnOrDefault(raw, locale): string` — used by Tasks 3 and 4 with exactly these names and signatures.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  defaultDashboard,
  isSafeReturn,
  parseLocale,
  safeReturnOrDefault,
  toSignin,
} from "../return";

describe("isSafeReturn", () => {
  it("accepts a same-locale deep link with query", () => {
    expect(isSafeReturn("/fa/diet/check?claim=abc", "fa")).toBe(true);
  });
  it("accepts the locale root", () => {
    expect(isSafeReturn("/fa", "fa")).toBe(true);
  });
  it("rejects cross-locale paths", () => {
    expect(isSafeReturn("/en/profile", "fa")).toBe(false);
  });
  it("rejects the signin loop", () => {
    expect(isSafeReturn("/fa/signin?returnUrl=%2Ffa%2Fprofile", "fa")).toBe(false);
  });
  it("rejects protocol-relative and absolute URLs", () => {
    expect(isSafeReturn("//evil.com/fa/profile", "fa")).toBe(false);
    expect(isSafeReturn("https://evil.com/fa/profile", "fa")).toBe(false);
  });
  it("rejects api-test paths", () => {
    expect(isSafeReturn("/fa/api-test/login", "fa")).toBe(false);
  });
  it("rejects null", () => {
    expect(isSafeReturn(null, "fa")).toBe(false);
  });
});

describe("parseLocale", () => {
  it("parses fa/en/ar prefixes", () => {
    expect(parseLocale("/fa/profile")).toBe("fa");
    expect(parseLocale("/en/diet?x=1")).toBe("en");
    expect(parseLocale("/ar")).toBe("ar");
  });
  it("falls back to fa", () => {
    expect(parseLocale(null)).toBe("fa");
    expect(parseLocale("/profile")).toBe("fa");
  });
});

describe("toSignin / safeReturnOrDefault", () => {
  it("encodes a safe return", () => {
    expect(toSignin("fa", "/fa/diet/check?claim=abc")).toBe(
      "/fa/signin?returnUrl=%2Ffa%2Fdiet%2Fcheck%3Fclaim%3Dabc",
    );
  });
  it("falls back to bare signin for unsafe input", () => {
    expect(toSignin("fa", "https://evil.com")).toBe("/fa/signin");
  });
  it("returns the dashboard default for unsafe input", () => {
    expect(safeReturnOrDefault("//evil.com", "fa")).toBe("/fa/profile/reservations");
    expect(defaultDashboard("en")).toBe("/en/profile/reservations");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/contexts/identity/__tests__/return.test.ts`
Expected: FAIL with "Cannot find module '../return'"

- [ ] **Step 3: Write minimal implementation**

```ts
const SUPPORTED_LOCALES = ["fa", "en", "ar"] as const;

export function parseLocale(echoed: string | null | undefined): string {
  const match = echoed?.match(/^\/(fa|en|ar)(\/|$)/);
  return match ? match[1] : "fa";
}

export function isSafeReturn(url: string | null | undefined, locale: string): boolean {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return false;
  if (url !== `/${locale}` && !url.startsWith(`/${locale}/`)) return false;
  if (url.includes("/signin")) return false;
  if (url.includes("/api-test")) return false;
  return true;
}

export function defaultDashboard(locale: string): string {
  return `/${locale}/profile/reservations`;
}

export function toSignin(locale: string, returnTo: string | null | undefined): string {
  if (!isSafeReturn(returnTo, locale)) return `/${locale}/signin`;
  return `/${locale}/signin?returnUrl=${encodeURIComponent(returnTo as string)}`;
}

export function safeReturnOrDefault(raw: string | null | undefined, locale: string): string {
  return isSafeReturn(raw, locale) ? (raw as string) : defaultDashboard(locale);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/contexts/identity/__tests__/return.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add src/contexts/identity/return.ts src/contexts/identity/__tests__/return.test.ts
git commit -m "feat(auth): central return-url helper with tests"
```

---

### Task 2: Session lifetimes (24h sliding)

**Files:**
- Modify: `src/lib/auth.ts:10-12` (add `session` block inside `betterAuth({...})`)

**Interfaces:**
- Consumes: nothing (better-auth reads `options.session.expiresIn/updateAge` in seconds; verified in `node_modules/better-auth/dist/context/create-context.mjs:145-148`).
- Produces: 24h sessions refreshed on activity after 12h; relied on by Task 4 (Remember-me) and Task 5 (manual checks).

- [ ] **Step 1: Edit `src/lib/auth.ts`**

```ts
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "angabin-teb-dev-secret-key-32chars-min!!",
  session: {
    expiresIn: 60 * 60 * 24, // 24h access; Remember-me extends via dontRememberMe flag
    updateAge: 60 * 60 * 12, // sliding refresh: activity after 12h re-issues + extends
  },
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat(auth): 24h session with 12h sliding refresh"
```

---

### Task 3: Path echo + guard redirects

**Files:**
- Modify: `src/proxy.ts:42-52` (insert guarded-prefix echo before `return NextResponse.next()`)
- Modify: `src/contexts/identity/actions.ts:1-22` (import helper, read header, locale-aware redirects)

**Interfaces:**
- Consumes: `toSignin`, `parseLocale` from Task 1.
- Produces: zero-arg `requireUser()` / `requireAdmin()` that redirect with `returnUrl`; no caller changes needed.

- [ ] **Step 1: Edit `src/proxy.ts`**

Insert after the `legacyTarget` block, before the final `return NextResponse.next();` in the `if (locale)` branch:

```ts
    const guarded = ["/profile", "/admin", "/support", "/diet/payment", "/diet/check"];
    if (guarded.some((g) => rest === g || rest.startsWith(`${g}/`))) {
      const echo = new Headers(req.headers);
      echo.set("x-auth-return", `${pathname}${req.nextUrl.search}`);
      return NextResponse.next({ request: { headers: echo } });
    }
    return NextResponse.next();
```

- [ ] **Step 2: Edit `src/contexts/identity/actions.ts`**

Replace lines 1-22 (imports + `requireUser` + `requireAdmin`) with:

```ts
"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, clinicalRegistries } from "@/db/schema";
import { parseLocale, toSignin } from "./return";

export async function requireUser() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) {
    const echoed = h.get("x-auth-return");
    redirect(toSignin(parseLocale(echoed), echoed));
  }
  return session.user;
}

export async function requireAdmin() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) {
    const echoed = h.get("x-auth-return");
    redirect(toSignin(parseLocale(echoed), echoed));
  }
  const locale = parseLocale(h.get("x-auth-return"));
  if ((session.user as { role?: string }).role !== "admin") redirect(`/${locale}`);
  return session.user;
}
```

Notes for the implementer: `requireAdmin`'s non-admin fallback changes from bare `/` to `/{locale}` (locale-aware; same destination). `toSignin` falls back to `/{locale}/signin` when the header is absent (e.g. tests), so behavior without proxy is a locale-aware signin. Everything below line 22 stays untouched.

- [ ] **Step 3: Typecheck + lint**

Run: `bunx tsc --noEmit`
Expected: 0 errors
Run: `bun run lint`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts src/contexts/identity/actions.ts
git commit -m "feat(auth): return-to-section on all guards via path echo"
```

---

### Task 4: Signin page (Remember-me + safe return + cookie fix)

**Files:**
- Modify: `src/app/[locale]/(auth)/signin/page.tsx:29-32` (validated return), `:34-39` (remember state), `:95-100` (verify pass-through), `:118-136` (demo flow), `:300-336` (checkbox + demo buttons)

**Interfaces:**
- Consumes: `safeReturnOrDefault` from Task 1; `rememberMe` flag on `authClient.phoneNumber.verify` (server accepts `rememberMe?: boolean` — `rememberMe === false` issues a session cookie, verified in `node_modules/better-auth/dist/plugins/phone-number/routes.mjs:17,99-107`).
- Produces: login lands on validated `returnUrl`; nothing downstream consumes output.

- [ ] **Step 1: Validated return + remember state**

Replace lines 29-32:

```tsx
  const rawReturnUrl = searchParams.get("returnUrl") || searchParams.get("callbackUrl");
  const returnUrl = safeReturnOrDefault(rawReturnUrl, locale);
```

Add the import at the top with the other `@/` imports:

```tsx
import { safeReturnOrDefault } from "@/contexts/identity/return";
```

Add state after line 39 (`const [isDemoPending, setIsDemoPending] = useState(false);`):

```tsx
  const [rememberMe, setRememberMe] = useState(false);
```

- [ ] **Step 2: Pass `rememberMe` on verify**

Replace lines 95-100:

```tsx
        const { error } = await authClient.phoneNumber.verify({
          phoneNumber,
          code: cleanCode,
          rememberMe,
        });
```

- [ ] **Step 3: Demo flow — unified return, no `document.cookie` mirror**

Replace the `handleDemoLogin` body (lines 118-136) with:

```tsx
  async function handleDemoLogin(requestedRole: "patient" | "admin" = "patient") {
    setIsDemoPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api-test/login?role=${requestedRole}`, { method: "POST" });
      if (!res.ok) throw new Error("Demo login endpoint unavailable");
      // Session cookie arrives via HttpOnly Set-Cookie; never mirror into document.cookie.
      const target =
        requestedRole === "admin" && !returnUrl.startsWith(`/${locale}/admin`)
          ? `/${locale}/admin`
          : returnUrl;
      window.location.href = target;
    } catch {
      setErrorMessage(t("demoError"));
      toast.error(t("demoError"), { duration: 4000 });
      setIsDemoPending(false);
    }
  }
```

- [ ] **Step 4: Remember-me checkbox UI**

Insert before the `{/* Divider */}` block (line 303), using logical props and existing token classes:

```tsx
          {/* Remember me */}
          <label
            htmlFor="remember-me"
            className="mt-5 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface cursor-pointer"
          >
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span>{t("rememberMe")}</span>
          </label>
```

- [ ] **Step 5: Typecheck + lint**

Run: `bunx tsc --noEmit`
Expected: 0 errors
Run: `bun run lint`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(auth)/signin/page.tsx"
git commit -m "feat(auth): remember-me plus safe return on signin"
```

---

### Task 5: Locale keys, demo comment, verification

**Files:**
- Modify: `messages/fa.json` (`auth` block), `messages/en.json`, `messages/ar.json`
- Modify: `src/app/api-test/login/route.ts:7-12` (comment only)

**Interfaces:**
- Consumes: `t("rememberMe")` from Task 4.
- Produces: green verification; nothing downstream.

- [ ] **Step 1: Add locale keys**

`messages/fa.json` in `auth`, after `demoAdmin`:

```json
    "rememberMe": "مرا به خاطر بسپار (۳۰ روزه)",
```

`messages/en.json` in `auth`:

```json
    "rememberMe": "Remember me (30 days)",
```

`messages/ar.json` in `auth`:

```json
    "rememberMe": "تذكرني (٣٠ يوماً)",
```

Match each file's existing indentation and trailing-comma style exactly.

- [ ] **Step 2: Demo route comment**

Replace lines 7-9 of `src/app/api-test/login/route.ts`:

```ts
// Demo login is ON in dev, and in prod only with explicit opt-in:
// DEMO_LOGIN_ENABLED=true. Anyone with the URL can mint a session
// (including admin), so never enable it on a site with real patient data.
// Sessions live 24h to match the OTP session lifetime; the cookie is
// HttpOnly (Set-Cookie) — clients must not mirror it into document.cookie.
```

No logic change in this file.

- [ ] **Step 3: Run targeted tests**

Run: `bunx vitest run src/contexts/identity/__tests__/return.test.ts`
Expected: PASS (13 tests)
Run: `bunx tsc --noEmit`
Expected: 0 errors
Run: `bun run lint`
Expected: 0 errors (the `no-await-in-loop` warnings in catalog actions are pre-existing and accepted)

- [ ] **Step 4: Manual checks (needs `docker compose up -d` + migrated + seeded DB + `bun run dev`)**

1. Logged-out cold navigate to `/fa/profile/calorie` → signin → OTP login → lands back on `/fa/profile/calorie`.
2. Same for `/fa/admin` as admin demo → lands back on `/fa/admin`; patient demo with `?returnUrl=/fa/admin` → lands on `/fa/admin` then admin layout bounces to `/fa` (role gate intact).
3. Unsafe `?returnUrl=https://evil.com` → falls back to `/fa/profile/reservations`.
4. Remember unchecked → session cookie (browser restart logs out); checked → persists.
5. Existing Playwright journeys stay green (no new e2e specs).

- [ ] **Step 5: Commit**

```bash
git add messages/fa.json messages/en.json messages/ar.json src/app/api-test/login/route.ts
git commit -m "feat(auth): remember-me copy plus demo lifetime note"
```
