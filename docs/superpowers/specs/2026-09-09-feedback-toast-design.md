# Global Feedback (toast + loading + error) — Design Spec

Date: 2026-09-09 | Status: approved (§1–§4) | Path: architectural
Goal: every async result in the app surfaces visibly — success / warning / error via toast, navigation via skeleton, route crash via retry boundary. No silent waits, no raw reason codes.

## 1. Architecture (central helper)

- Dep: `sonner` via `bun add sonner` (user-approved; only new dep).
- `src/app/[locale]/layout.tsx`: mount `<Toaster>` once inside `NextIntlClientProvider`, `dir={locale === "en" ? "ltr" : "rtl"}`, `position="bottom-center"`, `richColors`, `closeButton`, `toastOptions` durations (error 4000ms, success 2500ms).
- New `src/lib/feedback.ts` (pure, no React): `feedbackFor(reason | error-string) → { key, tone }` where tone ∈ `error | warning | success`. Covers booking (`capacity_exceeded→warning`, `rate_limited→warning`, `invalid_party|not_cancellable|same_slot|not_found→error`), nutrition (`already_claimed→warning`, `generation_failed|invalid_status|not_found→error`), any zod/validation string → `error`.
- New `src/components/clinical/use-action-feedback.ts` hook `useActionFeedback(namespace)`: wraps `useTransition`, holds inline `error` state, calls `toast[key tone](t(key))` via `next-intl`, returns `{ pending, error, run }`. Forms keep existing inline banners; toast added on server result (not on client pre-validation).
- Theming in `src/app/globals.css`: sonner vars mapped to clinical tokens (`--color-primary`, error container); `text-start`, logical props only.

## 2. UI behavior

- Toasts: bottom-center, dismissible, Persian-first copy. Success → primary tone; warning → amber (`secondary` tint); error → error-container. Never stack more than 3 (`visibleToasts={3}`).
- Loading: add `loading.tsx` skeletons reusing the booking pattern (`animate-pulse`, `surface-container-low` cards) for groups missing them: `(nutrition)`, `(content)`, `(account)`, `(auth)`, `admin/`, root `[locale]`. Keep existing `(booking)` + `(discovery)` files untouched.
- Error: add `error.tsx` per missing group reusing `ErrorState` + `t("states.retry")` + `reset()`. Log `digest` via `console.error` only; no Sentry.
- Pending buttons: keep current per-form spinner (`animate-spin` + `disabled:opacity-50`); no change to `src/components/ui/button.tsx`.

## 3. Data flow + i18n

- Flow: client form → client validate (inline only, no toast) → `run(() => action(input))` → `feedbackFor(result)` → inline `setError(t(key))` + `toast.tone(t(key))` → on `ok`: `toast.success` + `router.refresh()/push` as today.
- Keys under `feedback.*` in `messages/fa.json` (source of truth), mirrored in `en`/`ar.json`. Example: `feedback.capacityExceeded` = «ظرفیت این نوبت تکمیل شد» / "This slot just filled" / «اكتملت سعة هذا الموعد». Raw `reason` strings never render.
- Files touched (max 12): `layout.tsx`, `feedback.ts`, `use-action-feedback.ts`, `globals.css`, 4 forms (`reservation-form.tsx`, `reservations-client.tsx`, `log-food.tsx`, `signin/page.tsx` + `personal-info-form.tsx`), 6 `loading/error.tsx` pairs (new files only), 3 locale JSONs.

## 4. Testing

- Unit (vitest): `feedbackFor` covers every known reason + unknown fallback → error; no skipped cases.
- Static: `bunx tsc --noEmit` 0, `bun run lint` 0, `next build` 144+ pages OK.
- Manual (4 checks): full slot → warning toast + inline kept; cancel reservation → success toast; diet retry fail → error toast + retry; cold navigate to calorie/diet → skeleton < 1s. No new e2e specs (existing journeys must stay green).

## 5. Non-goals

No custom toast system, no change to `button.tsx` variants, no Sentry/logging infra, no streaming progress bars, no altering slot-capacity SQL guard or claim state machine, no directory renames, no `useFormStatus` migration.
