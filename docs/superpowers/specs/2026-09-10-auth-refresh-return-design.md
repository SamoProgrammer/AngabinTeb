# Auth Refresh + Return — Design Spec

Date: 2026-09-10 | Status: approved (chat) | Path: architectural
Goal: phone-OTP login stays valid 24h with sliding refresh + Remember-me 30d, every auth wall returns the user to where they started, demo buttons keep working, cookies/HttpOnly/open-redirect hardened. No custom token table.

## 1. Sessions (better-auth native, no new table)

- `src/lib/auth.ts`: `session: { expiresIn: 86400, updateAge: 43200 }`.
- Sliding refresh: any `getSession` after 12h re-issues token + extends expiry 24h (better-auth rotation). No client timer, no silent-renew loop.
- Remember-me: signin form adds unchecked-by-default checkbox. Checked → persistent cookie (30d via `rememberMe: true` on verify call). Unchecked → `dontRememberMe` session cookie (cleared on browser close).
- Demo `/api-test/login`: align expiry to 24h (already 24h), keep UI buttons as-is. Fix only the double-cookie write: keep `Set-Cookie HttpOnly` from route, drop `document.cookie` mirror in `signin/page.tsx:128`.
- Logout everywhere calls `authClient.signOut()` (revokes server session + clears cookie). No change to OTP send/verify throttle (5 sends / 10min per number, 3 tries per code).

## 2. Return flow (central helper)

- New pure helper `src/contexts/identity/return.ts`: `toSignin(locale, returnTo)` → `/{locale}/signin?returnUrl=<encodeURIComponent(returnTo)>`; `isSafeReturn(url, locale)` → true only when same-origin path, starts with `/{locale}/`, not `/signin`, not `/api-test`, no `//` or `http`.
- `requireUser(locale?: string, returnTo?: string)` / `requireAdmin(locale?, returnTo?)` build the redirect via helper. Callers pass locale + current path: `(account)/layout`, `admin/layout`, `support/requests`, `support/new`, `(diet)/diet/payment`, `(diet)/diet/check`, profile subpages keep calling bare `requireUser()` (layout already guards).
- `proxy.ts` stays locale-only (CVE-2025-29927 rule untouched). No edge auth check.
- Signin `returnUrl` handling (already reads `returnUrl|callbackUrl`): validate with `isSafeReturn`, fallback `/{locale}/profile/reservations`. Demo patient → validated `returnUrl`; demo admin → validated `returnUrl` if safe and under `/admin`, else `/{locale}/admin`. OTP success → validated `returnUrl`.

## 3. Hardening

- Cookies: `Secure` (https baseURL) + `HttpOnly` + `SameSite=Lax` + `path=/` — all via better-auth defaults + demo route `res.cookies.set`. No JS-readable session copy.
- Open redirect: every redirect into `returnUrl` passes `isSafeReturn`; unsafe → default dashboard.
- Demo route: stays 404 in production unless `DEMO_LOGIN_ENABLED=true` (existing gate untouched).
- No password, no JWT access-token layer, no refresh_token table. `account.refreshToken` columns stay unused (OAuth placeholder, out of scope).

## 4. Files touched (max 10)

1. `src/lib/auth.ts` (session config)
2. `src/contexts/identity/return.ts` (new, pure)
3. `src/contexts/identity/actions.ts` (requireUser/requireAdmin signature + redirect)
4. `src/app/[locale]/(account)/layout.tsx` (pass locale + path)
5. `src/app/[locale]/admin/layout.tsx` (same)
6. `src/app/[locale]/support/requests/page.tsx`, `support/new/page.tsx` (pass returnTo)
7. `src/app/[locale]/(diet)/diet/payment/page.tsx`, `diet/check/page.tsx` (same)
8. `src/app/[locale]/(auth)/signin/page.tsx` (Remember-me checkbox + safe-return + drop document.cookie)
9. `src/app/api-test/login/route.ts` (cookie comment only, no logic change except maxAge align)
10. `messages/{fa,en,ar}.json` (`auth.rememberMe` key only)

## 5. Testing

- Unit (vitest): `isSafeReturn` — valid locale path, cross-locale reject, `/signin` loop reject, `//evil` + `https://` reject, `/api-test` reject, query+hash preserved.
- Static: `bunx tsc --noEmit` 0, `bun run lint` 0.
- Manual (3 checks): deep link `/fa/profile/calorie` logged-out → signin → back to calorie; expired session mid-booking → re-login → booking page kept; Remember unchecked → browser restart logs out, checked → stays 30d. Existing Playwright journeys stay green, no new e2e.

## 6. Non-goals

No custom refresh table, no proxy auth gate, no SMS provider change, no role-request flow, no password/biometric login, no per-device session list, no demo-button removal, no claim/booking logic change.
