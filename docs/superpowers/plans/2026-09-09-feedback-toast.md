# Global Feedback (toast + loading + error) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire sonner toasts, route skeletons, and retry boundaries so no async result is silent.

**Architecture:** Single `<Toaster>` in `[locale]/layout.tsx`; pure `feedbackFor()` maps action reasons to `feedback.*` keys with tones; `useActionFeedback()` hook wraps `useTransition` + toast + inline error; shared skeleton/error components re-exported per route group.

**Tech Stack:** Next 16.3.3 App Router, React 19, sonner, next-intl 4, Tailwind v4, vitest 4, bun 1.4.0

**Spec:** `docs/superpowers/specs/2026-09-09-feedback-toast-design.md`

## Global Constraints

- Package manager is `bun` only — never pnpm/npm/yarn.
- RTL: logical Tailwind props only (`ps/pe`, `text-start`, `ms/me`); physical (`pl/pr`, `left/right`) forbidden.
- Icons: `lucide-react` direct imports only; dynamic names via `resolveIcon` from `@/components/clinical/icons`.
- Dates: Jalali via `JalaliDatePicker` + `formatJalali*`; native `type="date"`/`datetime-local` forbidden.
- Server Actions export `async` only; pure helpers live in `kernel.ts`/`lib`.
- `messages/fa.json` is source of truth; `en`/`ar.json` are overrides.
- Done means `bunx tsc --noEmit` 0, `bun run lint` 0, `bun run test` green, `next build` 144+ pages.

---

### Task 1: Mount sonner Toaster in locale layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx`
- Install: `sonner` via bun

**Interfaces:**
- Consumes: `ClinicalHeader`, `ClinicalFooter`, `MobileNav`, `NextIntlClientProvider` (existing).
- Produces: global `<Toaster>` with `dir`, `position="bottom-center"`, `richColors`, `closeButton`, `visibleToasts={3}` for all later tasks.

- [ ] **Step 1: Install sonner**

Run: `bun add sonner`
Expected: `package.json` gains `"sonner"` in dependencies.

- [ ] **Step 2: Mount Toaster in layout**

Edit `src/app/[locale]/layout.tsx`: add import and element (locale-aware dir, inside provider so toasts can use theme tokens):

```tsx
import { Toaster } from "sonner";
```

```tsx
<NextIntlClientProvider locale={locale} messages={messages}>
  <ClinicalHeader locale={locale} />
  <main className="flex-1 w-full">{children}</main>
  <ClinicalFooter locale={locale} />
  <MobileNav locale={locale} />
  <Toaster
    dir={locale === "en" ? "ltr" : "rtl"}
    position="bottom-center"
    richColors
    closeButton
    visibleToasts={3}
    toastOptions={{
      classNames: { toast: "text-start" },
    }}
  />
</NextIntlClientProvider>
```

- [ ] **Step 3: Typecheck + lint this task**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock src/app/[locale]/layout.tsx
git commit -m "feat(feedback): mount sonner Toaster in locale layout"
```

---

### Task 2: Pure reason map `feedbackFor()` with unit test (TDD)

**Files:**
- Create: `src/lib/feedback.ts`
- Test: `src/lib/__tests__/feedback.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export type FeedbackTone = "success" | "warning" | "error"`, `export interface Feedback { key: string; tone: FeedbackTone }`, `export function feedbackFor(reason: string): Feedback` — Task 3 imports this exact signature.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/feedback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { feedbackFor } from "@/lib/feedback";

describe("feedbackFor", () => {
  it("maps capacity_exceeded to a warning", () => {
    expect(feedbackFor("capacity_exceeded")).toEqual({
      key: "capacityExceeded",
      tone: "warning",
    });
  });
  it("maps rate_limited to a warning", () => {
    expect(feedbackFor("rate_limited")).toEqual({
      key: "rateLimited",
      tone: "warning",
    });
  });
  it("maps already_claimed to a warning", () => {
    expect(feedbackFor("already_claimed")).toEqual({
      key: "alreadyClaimed",
      tone: "warning",
    });
  });
  it("maps not_cancellable to an error", () => {
    expect(feedbackFor("not_cancellable").tone).toBe("error");
  });
  it("maps generation_failed to an error", () => {
    expect(feedbackFor("generation_failed")).toEqual({
      key: "generationFailed",
      tone: "error",
    });
  });
  it("maps not_found to an error", () => {
    expect(feedbackFor("not_found").tone).toBe("error");
  });
  it("falls back to genericError for unknown reasons", () => {
    expect(feedbackFor("something_weird")).toEqual({
      key: "genericError",
      tone: "error",
    });
  });
  it("falls back to genericError for empty string", () => {
    expect(feedbackFor("").tone).toBe("error");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/lib/__tests__/feedback.test.ts`
Expected: FAIL with "Failed to resolve import @/lib/feedback".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/feedback.ts`:

```ts
export type FeedbackTone = "success" | "warning" | "error";

export interface Feedback {
  key: string;
  tone: FeedbackTone;
}

const WARNINGS: Record<string, string> = {
  capacity_exceeded: "capacityExceeded",
  rate_limited: "rateLimited",
  already_claimed: "alreadyClaimed",
};

const ERRORS: Record<string, string> = {
  invalid_party: "invalidParty",
  not_cancellable: "notCancellable",
  same_slot: "sameSlot",
  not_found: "notFound",
  generation_failed: "generationFailed",
  invalid_status: "invalidStatus",
  provider_mismatch: "genericError",
  overlap: "genericError",
  bad_status: "invalidStatus",
  forbidden: "genericError",
};

export function feedbackFor(reason: string): Feedback {
  if (reason in WARNINGS) return { key: WARNINGS[reason], tone: "warning" };
  if (reason in ERRORS) return { key: ERRORS[reason], tone: "error" };
  return { key: "genericError", tone: "error" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/lib/__tests__/feedback.test.ts`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/feedback.ts src/lib/__tests__/feedback.test.ts
git commit -m "feat(feedback): add pure reason-to-toast map with tests"
```

---

### Task 3: `useActionFeedback` hook + locale keys

**Files:**
- Create: `src/components/clinical/use-action-feedback.ts`
- Modify: `messages/fa.json`, `messages/en.json`, `messages/ar.json` (add top-level `feedback` object)

**Interfaces:**
- Consumes: `feedbackFor` from `@/lib/feedback` (Task 2), `toast` from `sonner`, `useTranslations("feedback")`.
- Produces: `export function useActionFeedback(): { pending: boolean; error: string | null; run: <T extends ActionResult>(fn: () => Promise<T>, opts: { successKey: string; onOk?: (r: T & { ok: true }) => void }) => void; setError: (v: string | null) => void }` — Tasks 5–6 import this exact hook.

- [ ] **Step 1: Add `feedback` keys to `messages/fa.json`**

Insert after the top-level `"states"` object:

```json
"feedback": {
  "capacityExceeded": "ظرفیت این نوبت تکمیل شد؛ لطفاً زمان دیگری انتخاب کنید.",
  "rateLimited": "درخواست‌ها زیاد شد؛ چند لحظه دیگر تلاش کنید.",
  "alreadyClaimed": "این برنامه قبلاً برای شما ثبت شده است.",
  "invalidParty": "تعداد همراهان نامعتبر است.",
  "notCancellable": "این نوبت قابل لغو نیست.",
  "sameSlot": "نوبت جدید با نوبت فعلی یکسان است.",
  "notFound": "مورد درخواستی پیدا نشد.",
  "generationFailed": "تولید برنامه ناموفق بود؛ دوباره تلاش کنید.",
  "invalidStatus": "این عملیات در وضعیت فعلی مجاز نیست.",
  "genericError": "خطایی رخ داد؛ دوباره تلاش کنید.",
  "successBooked": "نوبت با موفقیت ثبت شد.",
  "successCancelled": "نوبت لغو شد.",
  "successLogged": "ثبت خوراک انجام شد.",
  "successSaved": "با موفقیت ذخیره شد."
},
```

- [ ] **Step 2: Mirror keys in `messages/en.json`**

```json
"feedback": {
  "capacityExceeded": "This slot just filled; please pick another time.",
  "rateLimited": "Too many requests; try again in a moment.",
  "alreadyClaimed": "This program is already registered for you.",
  "invalidParty": "Invalid party size.",
  "notCancellable": "This appointment cannot be cancelled.",
  "sameSlot": "The new slot is the same as the current one.",
  "notFound": "Requested item not found.",
  "generationFailed": "Plan generation failed; try again.",
  "invalidStatus": "This action is not allowed in the current state.",
  "genericError": "Something went wrong; try again.",
  "successBooked": "Appointment booked successfully.",
  "successCancelled": "Appointment cancelled.",
  "successLogged": "Food entry logged.",
  "successSaved": "Saved successfully."
},
```

- [ ] **Step 3: Mirror keys in `messages/ar.json`**

```json
"feedback": {
  "capacityExceeded": "اكتملت سعة هذا الموعد؛ اختر وقتًا آخر.",
  "rateLimited": "طلبات كثيرة؛ حاول بعد لحظات.",
  "alreadyClaimed": "هذا البرنامج مسجل لك مسبقًا.",
  "invalidParty": "عدد المرافقين غير صالح.",
  "notCancellable": "لا يمكن إلغاء هذا الموعد.",
  "sameSlot": "الموعد الجديد مطابق للموعد الحالي.",
  "notFound": "العنصر المطلوب غير موجود.",
  "generationFailed": "فشل إنشاء البرنامج؛ حاول مجددًا.",
  "invalidStatus": "هذا الإجراء غير مسموح في الحالة الحالية.",
  "genericError": "حدث خطأ؛ حاول مجددًا.",
  "successBooked": "تم حجز الموعد بنجاح.",
  "successCancelled": "تم إلغاء الموعد.",
  "successLogged": "تم تسجيل الوجبة.",
  "successSaved": "تم الحفظ بنجاح."
},
```

- [ ] **Step 4: Create the hook**

Create `src/components/clinical/use-action-feedback.ts`:

```ts
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { feedbackFor } from "@/lib/feedback";

export interface ActionResult {
  ok: boolean;
  reason?: string;
  error?: string;
}

export function useActionFeedback() {
  const t = useTranslations("feedback");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run<T extends ActionResult>(
    fn: () => Promise<T>,
    opts: { successKey: string; onOk?: (r: T) => void },
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.ok) {
          toast.success(t(opts.successKey));
          opts.onOk?.(res);
          return;
        }
        const fb = feedbackFor(res.reason ?? res.error ?? "");
        const msg = t(fb.key);
        setError(msg);
        if (fb.tone === "warning") toast.warning(msg, { duration: 4000 });
        else toast.error(msg, { duration: 4000 });
      } catch {
        const msg = t("genericError");
        setError(msg);
        toast.error(msg, { duration: 4000 });
      }
    });
  }

  return { pending, error, run, setError };
}
```

- [ ] **Step 5: Typecheck + lint this task**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/clinical/use-action-feedback.ts messages/fa.json messages/en.json messages/ar.json
git commit -m "feat(feedback): action hook plus fa/en/ar keys"
```

---

### Task 4: Shared skeleton/error plus route pairs

**Files:**
- Create: `src/components/clinical/route-skeleton.tsx`
- Create: `src/components/clinical/route-error.tsx`
- Create: `src/app/[locale]/(nutrition)/loading.tsx`, `src/app/[locale]/(nutrition)/error.tsx`
- Create: `src/app/[locale]/(content)/loading.tsx`, `src/app/[locale]/(content)/error.tsx`
- Create: `src/app/[locale]/(account)/loading.tsx`, `src/app/[locale]/(account)/error.tsx`
- Create: `src/app/[locale]/(auth)/loading.tsx`, `src/app/[locale]/(auth)/error.tsx`
- Create: `src/app/[locale]/admin/loading.tsx`, `src/app/[locale]/admin/error.tsx`
- Create: `src/app/[locale]/loading.tsx`, `src/app/[locale]/error.tsx`

**Interfaces:**
- Consumes: `ErrorState` from `@/components/clinical/empty-state`, `useTranslations("states")`.
- Produces: default `loading.tsx`/`error.tsx` boundaries for every group missing them; existing `(booking)` + `(discovery)` files untouched.

- [ ] **Step 1: Create shared skeleton**

Create `src/components/clinical/route-skeleton.tsx`:

```tsx
export default function RouteSkeleton() {
  return (
    <div aria-busy="true" className="w-full bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-surface-container-low border border-outline-variant/20" />
        <div className="bg-surface-container-lowest rounded-2xl shadow-tier-1 border border-outline-variant/30 p-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-surface-container-low" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create shared error**

Create `src/components/clinical/route-error.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/clinical/empty-state";

export function RouteError({ reset }: { reset: () => void }) {
  const t = useTranslations("states");
  return (
    <div className="w-full bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4">
        <ErrorState title={t("errorTitle")} hint={t("errorHint")} />
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold transition-colors self-center"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create nutrition pair**

Create `src/app/[locale]/(nutrition)/loading.tsx`:

```tsx
import RouteSkeleton from "@/components/clinical/route-skeleton";

export default function NutritionLoading() {
  return <RouteSkeleton />;
}
```

Create `src/app/[locale]/(nutrition)/error.tsx`:

```tsx
"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function NutritionError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
```

- [ ] **Step 4: Create content pair**

Create `src/app/[locale]/(content)/loading.tsx`:

```tsx
import RouteSkeleton from "@/components/clinical/route-skeleton";

export default function ContentLoading() {
  return <RouteSkeleton />;
}
```

Create `src/app/[locale]/(content)/error.tsx`:

```tsx
"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function ContentError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
```

- [ ] **Step 5: Create account pair**

Create `src/app/[locale]/(account)/loading.tsx`:

```tsx
import RouteSkeleton from "@/components/clinical/route-skeleton";

export default function AccountLoading() {
  return <RouteSkeleton />;
}
```

Create `src/app/[locale]/(account)/error.tsx`:

```tsx
"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function AccountError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
```

- [ ] **Step 6: Create auth pair**

Create `src/app/[locale]/(auth)/loading.tsx`:

```tsx
import RouteSkeleton from "@/components/clinical/route-skeleton";

export default function AuthLoading() {
  return <RouteSkeleton />;
}
```

Create `src/app/[locale]/(auth)/error.tsx`:

```tsx
"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function AuthError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
```

- [ ] **Step 7: Create admin pair**

Create `src/app/[locale]/admin/loading.tsx`:

```tsx
import RouteSkeleton from "@/components/clinical/route-skeleton";

export default function AdminLoading() {
  return <RouteSkeleton />;
}
```

Create `src/app/[locale]/admin/error.tsx`:

```tsx
"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function AdminError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
```

- [ ] **Step 8: Create root locale pair**

Create `src/app/[locale]/loading.tsx`:

```tsx
import RouteSkeleton from "@/components/clinical/route-skeleton";

export default function LocaleLoading() {
  return <RouteSkeleton />;
}
```

Create `src/app/[locale]/error.tsx`:

```tsx
"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function LocaleError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
```

- [ ] **Step 9: Typecheck + lint this task**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/clinical/route-skeleton.tsx src/components/clinical/route-error.tsx "src/app/[locale]/(nutrition)/loading.tsx" "src/app/[locale]/(nutrition)/error.tsx" "src/app/[locale]/(content)/loading.tsx" "src/app/[locale]/(content)/error.tsx" "src/app/[locale]/(account)/loading.tsx" "src/app/[locale]/(account)/error.tsx" "src/app/[locale]/(auth)/loading.tsx" "src/app/[locale]/(auth)/error.tsx" src/app/[locale]/admin/loading.tsx src/app/[locale]/admin/error.tsx src/app/[locale]/loading.tsx src/app/[locale]/error.tsx
git commit -m "feat(feedback): shared skeleton and error boundaries for all groups"
```

---

### Task 5: Wire booking forms to toast

**Files:**
- Modify: `src/app/[locale]/(booking)/booking/doctor/[slug]/reserve/reservation-form.tsx`
- Modify: `src/app/[locale]/(account)/profile/reservations/reservations-client.tsx`

**Interfaces:**
- Consumes: `useActionFeedback` from `@/components/clinical/use-action-feedback` (Task 3).
- Produces: booking + cancel flows show translated toast + keep inline banner; no raw `reason` strings rendered.

- [ ] **Step 1: Wire reservation form submit**

In `src/app/[locale]/(booking)/booking/doctor/[slug]/reserve/reservation-form.tsx`, replace the local busy/error state:

```tsx
import { useActionFeedback } from "@/components/clinical/use-action-feedback";
```

```tsx
const { pending: busy, error, run, setError } = useActionFeedback();
```

Replace `handleSubmit` body after client validation with:

```tsx
run(
  () =>
    bookAppointment({
      serviceId,
      slotId: selectedSlotId,
      partySize: 1,
      patientName: patientName.trim(),
      patientPhone: phoneNumber.trim(),
      notes:
        [notes.trim(), nationalId.trim() ? `nationalId: ${nationalId.trim()}` : ""]
          .filter(Boolean)
          .join(" | ") || undefined,
      idempotencyKey: crypto.randomUUID(),
    }) as Promise<{ ok: boolean; appointmentId?: string; reason?: string }>,
  {
    successKey: "successBooked",
    onOk: (res) => {
      if ("appointmentId" in res && res.appointmentId)
        router.push(`/${locale}/confirm?id=${res.appointmentId}`);
    },
  },
);
```

Delete the old `useState` busy/error lines and the try/catch capacity mapping. Keep the `{error && ...}` banner JSX unchanged.

- [ ] **Step 2: Wire reservation cancel**

In `src/app/[locale]/(account)/profile/reservations/reservations-client.tsx`, replace cancel state:

```tsx
import { useActionFeedback } from "@/components/clinical/use-action-feedback";
```

```tsx
const { pending, error: actionError, run, setError } = useActionFeedback();
```

Replace `handleConfirmCancel` with:

```tsx
const handleConfirmCancel = () => {
  if (!cancellingId || pending) return;
  const id = cancellingId;
  run(() => cancelAppointment(id), {
    successKey: "successCancelled",
    onOk: () => {
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
      );
      setCancellingId(null);
    },
  });
};
```

Remove `setPending`/`setError(res.reason)` raw-reason lines and the local `pending`/`error` `useState`s (keep `notice` removal: delete `notice` state + banner JSX since toast replaces it). Keep the modal `{actionError && ...}` banner bound to `actionError`.

- [ ] **Step 3: Typecheck + lint this task**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(booking)/booking/doctor/[slug]/reserve/reservation-form.tsx" "src/app/[locale]/(account)/profile/reservations/reservations-client.tsx"
git commit -m "feat(feedback): toast wiring for booking and cancel"
```

---

### Task 6: Wire nutrition, auth, and profile forms

**Files:**
- Modify: `src/components/nutrition/log-food.tsx`
- Modify: `src/app/[locale]/(auth)/signin/page.tsx` (SignInForm error paths only)
- Modify: `src/app/[locale]/(account)/profile/personal-info/personal-info-form.tsx`

**Interfaces:**
- Consumes: `useActionFeedback` (Task 3). `logIntake` result shape `{ ok: boolean; error?: string }`.
- Produces: food log shows success toast + refresh; OTP send/verify failures toast; profile save toasts. Client pre-validation stays inline-only.

- [ ] **Step 1: Wire food log submit**

In `src/components/nutrition/log-food.tsx`, replace `useTransition` import and state:

```tsx
import { useActionFeedback } from "@/components/clinical/use-action-feedback";
```

```tsx
const { pending, error, run, setError } = useActionFeedback();
const [success, setSuccess] = useState(false);
```

Replace the form `onSubmit` transition block with:

```tsx
run(
  () =>
    logIntake({
      foodId: food?.id ?? foodId,
      servingUnitId,
      quantity: Number(quantity),
      mealSlot,
      ...(periodId ? { periodId } : {}),
      ...(Number.isNaN(loggedAtMs) ? {} : { loggedAt: new Date(loggedAtMs).toISOString() }),
    }),
  {
    successKey: "successLogged",
    onOk: () => {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 5000);
    },
  },
);
```

Keep the `{error && <p role="alert">}` banner but render `error` from the hook (already translated). Delete the old `startTransition` wrapper and `setError(t.errorMsg)` line.

- [ ] **Step 2: Wire signin error paths to toast**

In `src/app/[locale]/(auth)/signin/page.tsx` SignInForm, add:

```tsx
import { toast } from "sonner";
import { useTranslations } from "next-intl";
```

Inside `handleSendOtp` and `handleVerifyOtp` catch/error branches, after each `setErrorMessage(...)` add the matching toast:

```tsx
toast.error(error.message || t("authError"), { duration: 4000 });
```

```tsx
toast.error(err instanceof Error ? err.message : t("authError"), { duration: 4000 });
```

```tsx
toast.error(t("demoError"), { duration: 4000 });
```

Keep the existing inline error banner and `isPending` button spinners unchanged. Do not toast client pre-validation (`invalidPhone`, `invalidOtp`) — inline only.

- [ ] **Step 3: Wire personal-info save**

In `src/app/[locale]/(account)/profile/personal-info/personal-info-form.tsx`, after the save result, add toasts matching the existing inline message:

```tsx
import { toast } from "sonner";
```

```tsx
if ("error" in res) toast.error(res.error, { duration: 4000 });
else toast.success(t("successMsg"), { duration: 2500 });
```

Keep existing `error`/`success` inline state unchanged.

- [ ] **Step 4: Typecheck + lint this task**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/nutrition/log-food.tsx "src/app/[locale]/(auth)/signin/page.tsx" "src/app/[locale]/(account)/profile/personal-info/personal-info-form.tsx"
git commit -m "feat(feedback): toast wiring for nutrition auth profile"
```

---

### Task 7: Full verification

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: all tasks above.
- Produces: green gate + manual proof.

- [ ] **Step 1: Run unit tests**

Run: `bun run test`
Expected: all pass (including 8 new `feedback.test.ts` cases); DB-backed suites may skip without `DATABASE_URL` (pre-existing).

- [ ] **Step 2: Run typecheck**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: 0 errors.

- [ ] **Step 4: Run production build**

Run: `bun run build`
Expected: 144+ pages build successfully (count grows with new loading/error routes).

- [ ] **Step 5: Manual proof (4 checks, needs dev server + seeded DB)**

Run: `docker compose up -d && bun run db:migrate && bun run db:seed`
Run: `bun run dev`

1. Book a full slot → amber warning toast + inline message kept.
2. Cancel a reservation → success toast, row moves to history.
3. Log food in calorie period → success toast + entry appears after refresh.
4. Cold-navigate to diet + calorie pages → skeleton flashes; break a route (throw in page) → error boundary with retry button.
