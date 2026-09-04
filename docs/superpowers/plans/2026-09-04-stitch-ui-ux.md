# Stitch UI/UX Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Angabin Teb into the complete Persian Clinical Wellness experience designed in Google Stitch (Project 2835568483852518005), establishing design tokens, typography, hybrid icon system, reusable clinical components, and upgrading all customer-facing and admin pages.

**Architecture:** Adopt a modular component hierarchy where base UI primitives and clinical domain assemblies (`ClinicalHeader`, `ClinicalFooter`, `UniversalSearchBar`, `DoctorCard`, `ServiceCard`, `MetabolismCalculator`, `AdminShell`) are isolated in `src/components/`, while Next.js App Router pages remain Server Components orchestrating Drizzle queries with graceful design fallbacks.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, Tailwind CSS v4, Bun 1.4, next-intl, Vazirmatn + Plus Jakarta Sans (`next/font/google`), Material Symbols Outlined + Lucide Icons, Drizzle ORM, vitest, oxlint.

**Spec:** [`docs/superpowers/specs/2026-09-04-stitch-ui-ux-design.md`](file:///e:/Programming/AngabinTeb/docs/superpowers/specs/2026-09-04-stitch-ui-ux-design.md)

## Global Constraints
- Package manager is **bun** (never pnpm, npm, or yarn).
- Typecheck `bunx tsc --noEmit` must pass with **0 errors**.
- Lint `bun run lint` (oxlint src) must pass with **0 errors** (accepted `no-await-in-loop` warnings in catalog actions permitted).
- All unit tests `bunx vitest run src/` must pass (**31/31 baseline + new tests**).
- Production build `bun run build` must succeed cleanly.
- Strict Persian RTL compliance (`dir="rtl"`, logical Tailwind props `ps/pe`, `text-start`, `gap`).
- Slot capacity safety: Maintain atomic SQL capacity guard (`UPDATE ... booked_count + $party <= capacity`).
- Business model: Pay-at-clinic appointment booking with zero platform fee.

---

### Task 1: Design Tokens, CSS Variables & Typography Setup

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/app/fonts.ts`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: Tailwind v4 `@theme`, `next/font/google`
- Produces:
  - Theme colors: `--color-primary`, `--color-primary-container`, `--color-secondary`, `--color-secondary-container`, `--color-tertiary`, `--color-surface`, `--color-surface-container-*`, `--color-on-surface`, etc.
  - Typography: CSS variables `--font-vazirmatn` and `--font-plus-jakarta-sans`.
  - Elevation shadow utility classes: `shadow-tier-1`, `shadow-tier-2`, `shadow-tier-3`.

- [ ] **Step 1: Create `src/app/fonts.ts` with Vazirmatn and Plus Jakarta Sans**

```typescript
import { Vazirmatn, Plus_Jakarta_Sans } from "next/font/google";

export const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});
```

- [ ] **Step 2: Update `src/app/globals.css` with Stitch design tokens and elevation tiers**

Add the `@theme` definition for the full Persian Clinical Wellness palette:
```css
@theme inline {
  --font-sans: var(--font-vazirmatn), var(--font-plus-jakarta-sans), system-ui, sans-serif;
  --font-body-md: var(--font-vazirmatn), var(--font-plus-jakarta-sans), system-ui, sans-serif;
  
  --color-primary: #005f4c;
  --color-primary-container: #0d7a63;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #a9ffe3;
  --color-primary-fixed: #98f4d7;
  --color-primary-fixed-dim: #7cd7bc;

  --color-secondary: #904d00;
  --color-secondary-container: #fe932c;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #663500;
  --color-secondary-fixed: #ffdcc3;
  --color-secondary-fixed-dim: #ffb77d;

  --color-tertiary: #005f54;
  --color-tertiary-container: #007a6d;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #a7ffef;
  --color-tertiary-fixed: #62fae3;
  --color-tertiary-fixed-dim: #3cddc7;

  --color-surface: #faf8ff;
  --color-surface-dim: #d2d9f4;
  --color-surface-bright: #faf8ff;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f2f3ff;
  --color-surface-container: #eaedff;
  --color-surface-container-high: #e2e7ff;
  --color-surface-container-highest: #dae2fd;
  --color-surface-variant: #dae2fd;
  --color-surface-tint: #006b56;

  --color-on-surface: #131b2e;
  --color-on-surface-variant: #3e4945;
  --color-inverse-surface: #283044;
  --color-inverse-on-surface: #eef0ff;

  --color-outline: #6e7a75;
  --color-outline-variant: #bdc9c3;

  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error: #ffffff;
  --color-on-error-container: #93000a;
}

.shadow-tier-1 {
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
}

.shadow-tier-2 {
  box-shadow: 0 10px 25px -4px rgba(10, 92, 74, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03);
}

.shadow-tier-3 {
  box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(226, 232, 240, 0.8);
}
```

- [ ] **Step 3: Update `src/app/[locale]/layout.tsx` to include font classes and Google Material Symbols link**

Import `vazirmatn` and `plusJakartaSans` from `@/app/fonts` and apply their class names to `<html>` and `<body>`, linking Google Material Symbols:
```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 4: Verify typecheck & lint**

Run: `bunx tsc --noEmit && bun run lint`  
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/fonts.ts src/app/globals.css src/app/[locale]/layout.tsx
git commit -m "feat(ui): configure Persian Clinical Wellness design tokens and Vazirmatn typography"
```

---

### Task 2: Global Clinical Chrome (Header, Footer & Mobile Nav)

**Files:**
- Create: `src/components/clinical/clinical-icon.tsx`
- Create: `src/components/layout/clinical-header.tsx`
- Create: `src/components/layout/clinical-footer.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/__tests__/chrome.test.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `next/link`, `next-intl`, `@/components/locale-switcher`, `@/lib/auth`
- Produces:
  - `<ClinicalIcon name={string} size={number?} fill={boolean?} className={string?} />`
  - `<ClinicalHeader locale={string} />`
  - `<ClinicalFooter />`
  - `<MobileNav locale={string} />`

- [ ] **Step 1: Implement `src/components/clinical/clinical-icon.tsx`**

A lightweight component that renders `<span className="material-symbols-outlined ...">` with optional fill and size attributes.

- [ ] **Step 2: Implement `src/components/layout/clinical-header.tsx`**

Sticky glass navigation bar with:
- Brand logo: Emerald badge with hospital cross, title "انگبین طب", subtitle "سامانه سلامت و تغذیه بالینی".
- Navigation links: نوبت‌دهی پزشکان (`/doctors`), خدمات درمانی (`/services`), پرونده و تغذیه (`/nutrition`), مجله سلامت (`/articles`), درباره ما (`/about`), تماس با ما (`/contact`).
- Locale switcher (FA / EN / AR).
- Hotline call pill (`پشتیبانی فوری: ۰۲۱-۸۸۲۲۴۰۰۰`).
- Patient Auth CTA button (`ورود / پرونده من`).

- [ ] **Step 3: Implement `src/components/layout/clinical-footer.tsx`**

Clinical footer with:
- Emergency disclaimer banner: "توجه: انگبین طب سامانه اعزام اورژانس پزشکی نیست. در شرایط بحرانی با ۱۱۵ تماس بگیرید."
- Booking transparency banner: "تمامی نوبت‌های پزشکی بدون اخذ کارمزد آنلاین و با پرداخت حضوری در مطب رزرو می‌شوند."
- 4-column clinical link sitemap.
- Verified medical badges & copyright.

- [ ] **Step 4: Implement `src/components/layout/mobile-nav.tsx`**

Sticky bottom bar for mobile screens (<768px): خانه (`/`), پزشکان (`/doctors`), تغذیه (`/nutrition`), نوبت‌ها (`/appointments`), پشتیبانی (`/support`).

- [ ] **Step 5: Write unit test in `src/components/layout/__tests__/chrome.test.tsx`**

Test header brand title, emergency hotline label, and footer emergency disclaimer rendering.

- [ ] **Step 6: Mount Chrome components into `src/app/[locale]/layout.tsx`**

Render `<ClinicalHeader locale={locale} />`, `<main className="min-h-screen pt-20">{children}</main>`, `<ClinicalFooter />`, and `<MobileNav locale={locale} />`.

- [ ] **Step 7: Run tests & commit**

Run: `bunx vitest run src/components/layout/__tests__/ && bunx tsc --noEmit`  
Expected: PASS with 0 errors.

```bash
git add src/components/clinical/clinical-icon.tsx src/components/layout/ src/app/[locale]/layout.tsx
git commit -m "feat(ui): implement ClinicalHeader, ClinicalFooter, and MobileNav global chrome"
```

---

### Task 3: Shared Clinical Primitives & Universal Search

**Files:**
- Create: `src/components/clinical/universal-search-bar.tsx`
- Create: `src/components/catalog/doctor-card.tsx`
- Create: `src/components/catalog/service-card.tsx`
- Create: `src/components/clinical/trust-metrics.tsx`
- Create: `src/components/clinical/media-cards.tsx`
- Create: `src/components/clinical/__tests__/clinical-primitives.test.tsx`

**Interfaces:**
- Consumes: `<ClinicalIcon />`, `next/link`, `next/image`
- Produces:
  - `<UniversalSearchBar />`: Tabbed search component with filter pills (*پزشکان*, *خدمات*, *رژیم*, *مقالات*).
  - `<DoctorCard doctor={Doctor} />`: Physician profile card with rating, next slot, and booking CTA.
  - `<ServiceCard service={Service} />`: Diagnostic package card with fasting rules and pricing.
  - `<TrustMetrics />`: 4 stat badges and 3 trust pillars.
  - `<ArticleCard article={Article} />` & `<VideoCard video={Video} />`.

- [ ] **Step 1: Implement `src/components/clinical/universal-search-bar.tsx`**

Client component with tab pill toggles, dynamic input placeholder, RTL input alignment, microphone icon, submit action, and trust guarantees.

- [ ] **Step 2: Implement `src/components/catalog/doctor-card.tsx`**

Card with physician photo avatar, verified tick, specialty, academic title, star rating pill (`۴.۹`), next slot preview (`فردا ساعت ۱۰:۳۰`), clinic address, approved fee, and booking button.

- [ ] **Step 3: Implement `src/components/catalog/service-card.tsx`**

Diagnostic package card with category pill, description, fasting warning chip (`نیازمند ۱۰ ساعت ناشتایی`), duration (`۳۰ دقیقه`), price (`۴۸۰,۰۰۰ تومان`), and booking CTA.

- [ ] **Step 4: Implement `src/components/clinical/trust-metrics.tsx`**

Metrics row (+120 doctors, +45k visits, +800 foods, 100% pay-at-clinic) and 3 trust cards (حفاظت از پرونده بالینی, تعرفه مصوب, پشتیبانی بیمار).

- [ ] **Step 5: Implement `src/components/clinical/media-cards.tsx`**

`ArticleCard` with reading time and author; `VideoCard` with play badge and duration tag.

- [ ] **Step 6: Write unit test in `src/components/clinical/__tests__/clinical-primitives.test.tsx`**

Test rendering and formatting of physician credentials, service prices, and search bar category selection.

- [ ] **Step 7: Run tests & commit**

Run: `bunx vitest run src/components/clinical/__tests__/ && bunx tsc --noEmit`  
Expected: PASS.

```bash
git add src/components/clinical/ src/components/catalog/
git commit -m "feat(ui): implement DoctorCard, ServiceCard, UniversalSearchBar, and TrustMetrics"
```

---

### Task 4: Interactive Live Metabolism Calculator Component

**Files:**
- Create: `src/components/clinical/metabolism-calculator.tsx`
- Create: `src/lib/metabolism.ts`
- Create: `src/lib/__tests__/metabolism.test.ts`

**Interfaces:**
- Produces:
  - `calculateBmr({ gender, weightKg, heightCm, ageYears }): number`
  - `calculateTdee(bmr: number, activityMultiplier: number): number`
  - `calculateBmi(weightKg: number, heightCm: number): { bmi: number, label: string }`
  - `<MetabolismCalculator />`: Interactive reactive client widget.

- [ ] **Step 1: Write test `src/lib/__tests__/metabolism.test.ts` for Mifflin-St Jeor calculations**

```typescript
import { describe, it, expect } from "vitest";
import { calculateBmr, calculateTdee, calculateBmi } from "../metabolism";

describe("Mifflin-St Jeor calculations", () => {
  it("calculates male BMR correctly", () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
    const bmr = calculateBmr({ gender: "male", weightKg: 70, heightCm: 175, ageYears: 30 });
    expect(Math.round(bmr)).toBe(1649);
  });

  it("calculates female BMR correctly", () => {
    // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
    const bmr = calculateBmr({ gender: "female", weightKg: 60, heightCm: 165, ageYears: 28 });
    expect(Math.round(bmr)).toBe(1330);
  });

  it("calculates TDEE with moderate activity", () => {
    const tdee = calculateTdee(1600, 1.55);
    expect(tdee).toBe(2480);
  });

  it("classifies BMI correctly", () => {
    expect(calculateBmi(70, 175).label).toBe("محدوده ایده‌آل و طبیعی");
    expect(calculateBmi(95, 175).label).toBe("محدوده چاقی بالینی");
  });
});
```

- [ ] **Step 2: Implement `src/lib/metabolism.ts`**

Implement `calculateBmr`, `calculateTdee`, and `calculateBmi`.

- [ ] **Step 3: Run test to verify it passes**

Run: `bunx vitest run src/lib/__tests__/metabolism.test.ts`  
Expected: PASS.

- [ ] **Step 4: Implement `src/components/clinical/metabolism-calculator.tsx`**

Client component with gender radio cards, age/height/weight inputs, activity dropdown, and live gradient card showing BMR, TDEE, and BMI classification with Persian digits (`toLocaleDateString('fa-IR')` / Persian numbers).

- [ ] **Step 5: Run typecheck & commit**

Run: `bunx tsc --noEmit`  
Expected: 0 errors.

```bash
git add src/lib/metabolism.ts src/lib/__tests__/metabolism.test.ts src/components/clinical/metabolism-calculator.tsx
git commit -m "feat(nutrition): implement Mifflin-St Jeor metabolism math engine and live UI widget"
```

---

### Task 5: Reconstruct Landing Page (`src/app/[locale]/page.tsx`)

**Files:**
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `UniversalSearchBar`, `DoctorCard`, `ServiceCard`, `MetabolismCalculator`, `ArticleCard`, `VideoCard`, `TrustMetrics`.
- Produces: Full Stitch Screen #13 implementation in Next.js Server Component.

- [ ] **Step 1: Update `src/app/[locale]/page.tsx`**

Implement:
1. Ambient Hero Section with glow radial gradients and `UniversalSearchBar`.
2. 5-Fold Quick Action Cards (نوبت‌دهی پزشکان, خدمات پاراکلینیک, سنجش سوخت‌وساز, دفترچه کالری‌شمار, رژیم‌درمانی).
3. Featured Specialists Grid with 4 doctor cards (Dr. Leila Sadat, Dr. Arash Radmanesh, Dr. Sara Mahdavi, Dr. Payam Bahrami) with live slot chips.
4. Paraclinical Services Showcase with 4 diagnostic cards (متابولیک, InBody, مشاوره تغذیه, اکوکاردیوگرافی).
5. Interactive `MetabolismCalculator` Section with Mifflin-St Jeor engine.
6. Clinical Knowledge & Video Library Showcase (2 articles + 1 video card).
7. Trust & Transparency Metrics Row and Pillars.

- [ ] **Step 2: Verify typecheck & test suite**

Run: `bunx tsc --noEmit && bunx vitest run src/`  
Expected: 0 errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat(home): complete Landing Page reconstruction matching Stitch Screen 13"
```

---

### Task 6: Discovery & Booking Subsystem Overhaul

**Files:**
- Modify: `src/app/[locale]/(discovery)/doctors/page.tsx`
- Modify: `src/app/[locale]/(discovery)/doctors/[slug]/page.tsx`
- Modify: `src/app/[locale]/(discovery)/services/page.tsx`
- Modify: `src/app/[locale]/(discovery)/services/[slug]/page.tsx`
- Modify: `src/app/[locale]/(booking)/services/[slug]/book/page.tsx`
- Modify: `src/app/[locale]/(booking)/confirm/page.tsx`
- Modify: `src/app/[locale]/(discovery)/search/page.tsx`

**Interfaces:**
- Consumes: `catalog/queries.ts`, `booking/actions.ts`, `DoctorCard`, `ServiceCard`.

- [ ] **Step 1: Modernize Doctors Directory (`/doctors` — Screen #7)**

Filter sidebar for specialties, search input, responsive 3-column doctor cards grid, pagination.

- [ ] **Step 2: Modernize Doctor Profile (`/doctors/[slug]` — Screen #37)**

Physician dossier: biography, medical credentials, clinic locations, working hours, and slot booking picker.

- [ ] **Step 3: Modernize Services Directory & Detail (`/services` & `[slug]` — Screens #39 & #3)**

Category tabs (آزمایشگاه, تصویربرداری, آنالیز, تغذیه), preparation checklist, and appointment scheduling.

- [ ] **Step 4: Modernize Slot Booking & Confirmation (`/book` & `/confirm` — Screens #8 & #20)**

Interactive slot picker, date chips, pay-at-clinic notice, and printable digital receipt with clinic address and reminder note.

- [ ] **Step 5: Modernize Universal Search (`/search` — Screen #21)**

Faceted search tabs for doctors, services, articles, and foods.

- [ ] **Step 6: Run typecheck & tests**

Run: `bunx tsc --noEmit && bunx vitest run src/`  
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/(discovery)/ src/app/[locale]/(booking)/
git commit -m "feat(booking): overhaul doctors, services, slot booking, and digital receipt"
```

---

### Task 7: Nutrition Subsystem Overhaul

**Files:**
- Modify: `src/app/[locale]/(nutrition)/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/body/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/diary/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/diet/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/foods/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/foods/[id]/page.tsx`

**Interfaces:**
- Consumes: `nutrition/queries.ts`, `nutrition/actions.ts`, `MetabolismCalculator`.

- [ ] **Step 1: Modernize Nutrition Hub (`/nutrition` — Screen #14)**

Dashboard with BMR quick-tool, food diary shortcut, featured diet packages, and nutrition tips.

- [ ] **Step 2: Modernize Body Profile (`/nutrition/body` — Screen #41)**

Biometric calculation and body composition history tracking.

- [ ] **Step 3: Modernize Food Diary & Tracker (`/nutrition/diary` — Screen #11)**

Daily meal log (breakfast, lunch, dinner, snack) with traditional Iranian measurement units (کفگیر, پیاله, قاشق غذاخوری, پرس) and macro progress bars.

- [ ] **Step 4: Modernize Clinical Diet Plans (`/nutrition/diet` — Screens #16, #24, #26)**

Diet packages for Fatty Liver, Gout, Diabetes, and Corporate Wellness with clinical indication tags and specialist nutritionists.

- [ ] **Step 5: Modernize Food Database & Nutrition Detail (`/foods` & `[id]` — Screens #36 & #17)**

Persian food dictionary with macro and micro-nutrient breakdown tables per traditional serving size.

- [ ] **Step 6: Run typecheck & tests**

Run: `bunx tsc --noEmit && bunx vitest run src/`  
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/(nutrition)/
git commit -m "feat(nutrition): overhaul Nutrition Hub, Food Diary, Diet Plans, and Food Database"
```

---

### Task 8: Content & Health Knowledge Hub Overhaul

**Files:**
- Modify: `src/app/[locale]/(content)/articles/page.tsx`
- Modify: `src/app/[locale]/(content)/articles/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/topics/page.tsx`
- Modify: `src/app/[locale]/(content)/topics/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/videos/page.tsx`
- Modify: `src/app/[locale]/(content)/conditions/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/faq/page.tsx`

**Interfaces:**
- Consumes: `content/queries.ts`, `ArticleCard`, `VideoCard`.

- [ ] **Step 1: Modernize Articles Library & Article Reader (`/articles` & `[slug]` — Screen #42)**

Article list with clinical topic pills and reading view with physician author credentials and related tests.

- [ ] **Step 2: Modernize Health Topics & Topic 360 Hub (`/topics` & `[slug]` — Screens #2 & #28)**

Clinical topics directory and Diabetes 360 hub with multi-specialty consultations and educational videos.

- [ ] **Step 3: Modernize Educational Video Library (`/videos` — Screen #47)**

Clinical video lecture cards with duration badges and physician speaker tags.

- [ ] **Step 4: Modernize Conditions & FAQ (`/conditions/[slug]` & `/faq` — Screens #48 & #29)**

Medical symptom dictionary and patient guidelines accordion.

- [ ] **Step 5: Run typecheck & tests**

Run: `bunx tsc --noEmit && bunx vitest run src/`  
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/(content)/
git commit -m "feat(content): overhaul Articles, Topics 360 Hub, Videos, and FAQ"
```

---

### Task 9: Patient Account, Support, Marketing & Admin Shell

**Files:**
- Modify: `src/app/[locale]/(account)/appointments/page.tsx`
- Modify: `src/app/[locale]/(account)/notifications/page.tsx`
- Modify: `src/app/[locale]/support/page.tsx`
- Modify: `src/app/[locale]/(marketing)/about/page.tsx`
- Modify: `src/app/[locale]/(marketing)/contact/page.tsx`
- Create: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/[locale]/admin/page.tsx`
- Modify: `src/app/[locale]/admin/categories/page.tsx`
- Modify: `src/app/[locale]/admin/services/page.tsx`
- Modify: `src/app/[locale]/admin/locations/page.tsx`
- Modify: `src/app/[locale]/admin/providers/page.tsx`
- Modify: `src/app/[locale]/admin/scheduling/page.tsx`
- Modify: `src/app/[locale]/admin/foods/page.tsx`
- Modify: `src/app/[locale]/admin/diet-programs/page.tsx`
- Modify: `src/app/[locale]/admin/content/page.tsx`
- Modify: `src/app/[locale]/admin/support/page.tsx`
- Modify: `src/app/[locale]/admin/settings/page.tsx`

**Interfaces:**
- Produces: `<AdminShell activeNav={string}>{children}</AdminShell>`

- [ ] **Step 1: Modernize Patient Appointments & Notifications (`/appointments` & `/notifications` — Screens #31 & #10)**

Upcoming and past appointment cards with cancellation/reschedule actions and clinic directions.

- [ ] **Step 2: Modernize Support & Helpdesk (`/support` — Screens #1, #9, #50)**

Ticket submission form with category pills and inquiry history.

- [ ] **Step 3: Modernize Marketing Pages (`/about` & `/contact` — Screens #22, #33, #44)**

About Us story, clinical governance board, and clinic location cards with hotline telephone numbers.

- [ ] **Step 4: Implement `src/components/admin/admin-shell.tsx`**

Unified admin navigation sidebar (Operations, Services, Categories, Locations, Providers, Scheduling, Foods, Diets, Content, Support, Settings) with breadcrumbs and user avatar.

- [ ] **Step 5: Apply `AdminShell` to all `/admin/*` views (Screens #4, #5, #6, #19, #32, #34, #35, #38, #40, #46, #49)**

Upgrade all admin table pages with Stitch styling, search inputs, status badges, and action buttons.

- [ ] **Step 6: Run typecheck & tests**

Run: `bunx tsc --noEmit && bunx vitest run src/`  
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/(account)/ src/app/[locale]/support/ src/app/[locale]/(marketing)/ src/components/admin/ src/app/[locale]/admin/
git commit -m "feat(admin): implement AdminShell and upgrade Account, Support, and Admin consoles"
```

---

### Task 10: Seed Persona Enrichment & Full System Verification

**Files:**
- Modify: `scripts/seed.ts`
- Modify: `scripts/seed-nutrition.ts`
- Modify: `scripts/seed-content.ts`

**Interfaces:**
- Aligns database rows with Stitch personas: Dr. Leila Sadat, Dr. Arash Radmanesh, Dr. Sara Mahdavi, Dr. Payam Bahrami, Iranian dishes, and health articles.

- [ ] **Step 1: Enrich `scripts/seed.ts`**

Add verified medical council numbers, exact specialties, and approved consultation fees matching the design.

- [ ] **Step 2: Enrich `scripts/seed-nutrition.ts`**

Add Persian dishes (چلو کته زعفرانی, ته‌چین سنتی, قورمه‌سبزی, ماست و خیار) with traditional serving units (کفگیر, پیاله, قاشق, برش).

- [ ] **Step 3: Enrich `scripts/seed-content.ts`**

Add clinical articles (کنترل کبد چرب, کالری پلوهای سنتی, مقاومت به انسولین) and topics.

- [ ] **Step 4: Run full verification suite**

Run:
1. `bunx tsc --noEmit` -> Must be 0 errors.
2. `bun run lint` -> Must be 0 errors.
3. `bunx vitest run src/` -> Must be 31+ passed.
4. `bun run build` -> Next.js production build succeeds.

- [ ] **Step 5: Commit & finalize**

```bash
git add scripts/seed.ts scripts/seed-nutrition.ts scripts/seed-content.ts
git commit -m "chore(seed): enrich clinical personas, Persian foods, and articles from Stitch design"
```

---
