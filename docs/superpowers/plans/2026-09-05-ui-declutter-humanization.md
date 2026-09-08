# UI De-Slop & Platform-Wide Humanization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate AI-generated micro-labels, fake telemetry, redundant badges, and synthetic data dumps across all 50+ screens and clinical components of Angabin Teb to achieve a calm, human, and professional clinical experience.

**Architecture:** Systematic surgical de-slop executed in 7 domain tiers (Chrome, Landing, Discovery, Booking, Nutrition, Content, Account/Admin). Every change removes decorative kickers and synthetic mock data while retaining dynamic state badges, improving Persian copywriting, and maintaining 100% test and build integrity.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, Tailwind CSS v4, Bun (`bun`), next-intl, Drizzle ORM, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-05-ui-declutter-humanization-design.md`

## Global Constraints

- **Package Manager:** Use `bun` exclusively (never `npm`, `pnpm`, or `yarn`).
- **Logical Directionality:** Strictly adhere to Tailwind logical CSS properties (`ps/pe`, `ms/me`, `text-start`, `border-s/border-e`, `start-0/end-0`). Physical direction properties (`pl/pr`, `ml/mr`, `left/right`) are strictly forbidden.
- **Iconography:** Use `<ClinicalIcon name="..." />` rendering Material Symbols Outlined font ligatures.
- **Data Integrity:** Real data or elegant empty states only. No synthetic numbers, fake progress bars, or hardcoded meal logs.
- **Badge Policy:** Badges are permitted only for dynamic, actionable states (e.g. `ظرفیت تکمیل`, `نوبت حضوری`, `لغو شده`). Decorative platitudes (`تایید بالینی`, `پزشک تایید شده`) must be removed.
- **Verification Gates:** Each task must conclude with passing Vitest unit tests, clean typecheck (`bunx tsc --noEmit`), and clean lint (`bun run lint`).

---

### Task 1: Global Chrome & Universal Search Bar Refinement

**Files:**
- Modify: `src/components/clinical/universal-search-bar.tsx`
- Modify: `src/components/layout/clinical-header.tsx`
- Modify: `src/components/layout/clinical-footer.tsx`
- Test: `src/components/clinical/__tests__/clinical-primitives.test.tsx`
- Test: `src/components/layout/__tests__/chrome.test.tsx`

**Interfaces:**
- Consumes: `UniversalSearchBarProps` from `src/components/clinical/universal-search-bar.tsx`
- Produces: Cleaned search bar without non-functional microphone icon, button text «جستجو», clean header mega-menus, and decluttered footer.

- [ ] **Step 1: Update failing tests for Universal Search Bar and Chrome**

In `src/components/clinical/__tests__/clinical-primitives.test.tsx`, update the search bar tests to assert that:
1. The fake mic icon (`>mic</span>`) is no longer rendered.
2. The search button says `جستجو` instead of `جستجوی هوشمند`.

```tsx
    it("renders search icon, accessible input, and submit button", () => {
      const html = renderToString(<UniversalSearchBar locale="fa" />);
      expect(html).toContain(">search</span>");
      expect(html).not.toContain(">mic</span>");
      expect(html).toContain("جستجو");
      expect(html).toContain(">arrow_back</span>");
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/components/clinical/__tests__/clinical-primitives.test.tsx`
Expected: FAIL with assertion error expecting `>mic</span>` not to be found or `جستجو` match.

- [ ] **Step 3: Implement minimal code changes in Chrome and Search Bar**

In `src/components/clinical/universal-search-bar.tsx`:
1. Remove the fake mic button (`<button aria-label="جستجوی صوتی">...<ClinicalIcon name="mic" />...</button>`).
2. Update the submit button text from `<span>جستجوی هوشمند</span>` to `<span>جستجو</span>`.
3. Refine input placeholder: `«جستجوی نام پزشک، تخصص، خدمت درمانی یا مقاله سلامت...»`.

In `src/components/layout/clinical-header.tsx`:
1. Remove decorative badge tags inside mega-dropdown menus.
2. Ensure clean category titles: «پزشکان و متخصصان»، «خدمات درمانی و تشخیصی»، «برنامه‌ها و ابزارهای تغذیه»، «دانشنامه و مقالات سلامت».

In `src/components/layout/clinical-footer.tsx`:
1. Remove redundant kicker labels above footer link columns.
2. Maintain emergency 115 banner and zero-commission guarantee in clean, uncluttered cards.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/components/clinical/__tests__/clinical-primitives.test.tsx src/components/layout/__tests__/chrome.test.tsx`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit changes**

```bash
git add src/components/clinical/universal-search-bar.tsx src/components/layout/clinical-header.tsx src/components/layout/clinical-footer.tsx src/components/clinical/__tests__/clinical-primitives.test.tsx src/components/layout/__tests__/chrome.test.tsx
git commit -m "feat(chrome): de-slop search bar, remove fake mic, and clean header/footer micro-labels"
```

---

### Task 2: Landing Page De-Slop & Typographic Clarification

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Test: `src/app/[locale]/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: Catalog and content queries (`listDoctors`, `listServices`, `listContent`), `UniversalSearchBar`
- Produces: Landing page with clear H1/H2 headlines and no decorative kicker tags (`heroBadge`, `systemsKicker`, `doctorsKicker`, `servicesKicker`, `knowledgeKicker`, `pathKicker`).

- [ ] **Step 1: Update failing tests for Landing Page**

In `src/app/[locale]/__tests__/page.test.tsx`, update test assertions to reflect humanized headlines and removed kickers:
1. Hero headline: `مرجع نوبت‌دهی پزشکی، خدمات سلامت و تغذیه بالینی`
2. Remove expectation for decorative `heroBadge` (`سامانه یکپارچه سلامت، درمان و تغذیه بالینی`) or update it to check for clean H1 headline.
3. Check that the search button rendered within Hero displays `جستجو`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/app/[locale]/__tests__/page.test.tsx`
Expected: FAIL due to modified headline and kicker expectations.

- [ ] **Step 3: Implement Landing Page humanization in `src/app/[locale]/page.tsx`**

1. Hero Section:
   - Remove `heroBadge` tag and pulsing dot.
   - Set clean, authoritative H1: `مرجع نوبت‌دهی پزشکی، خدمات سلامت و تغذیه بالینی`.
   - Set natural subtitle: `دسترسی مستقیم به پزشکان متخصص، مراکز معتبر پاراکلینیک و سنجش علمی سوخت‌وساز بدن بر اساس استانداردهای بومی ایران.`
2. Care Pathways Section:
   - Remove `systemsKicker` («مسیرهای مراقبت ۳۶۰ درجه»).
   - Heading: `مراقبت تخصصی سلامت بر اساس نیاز شما`.
3. Doctor Spotlight:
   - Remove `doctorsKicker` («کادر درمان معتبر»).
   - Heading: `پزشکان و متخصصان برجسته`.
4. Clinical Services:
   - Remove `servicesKicker` («خدمات بالینی و پاراکلینیکی»).
   - Heading: `خدمات تشخیصی و درمانی`.
5. Knowledge & Magazine:
   - Remove `knowledgeKicker` («دانشنامه سلامت و سبک زندگی»).
   - Heading: `تازه‌ترین مقالات و آموزش‌های پزشکی`.
6. Trust Metrics:
   - Replace generic AI telemetry badges with clean, authoritative trust points: `بیش از ۵۰ پزشک متخصص`, `پرداخت مستقیم در مطب`, `پشتیبانی روزانه بیماران`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/app/[locale]/__tests__/page.test.tsx`
Expected: PASS (all 16 tests pass).

- [ ] **Step 5: Commit changes**

```bash
git add src/app/[locale]/page.tsx src/app/[locale]/__tests__/page.test.tsx
git commit -m "feat(landing): eliminate decorative kickers and refine typographic hierarchy"
```

---

### Task 3: Catalog & Discovery Cards (`doctor-card.tsx`, `service-card.tsx`, `services/page.tsx`, `doctors/page.tsx`, `search/page.tsx`)

**Files:**
- Modify: `src/components/catalog/doctor-card.tsx`
- Modify: `src/components/catalog/service-card.tsx`
- Modify: `src/app/[locale]/(discovery)/services/page.tsx`
- Modify: `src/app/[locale]/(discovery)/doctors/page.tsx`
- Modify: `src/app/[locale]/(discovery)/search/page.tsx`
- Test: `src/components/clinical/__tests__/clinical-primitives.test.tsx`
- Test: `src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`

**Interfaces:**
- Consumes: Doctor and Service database rows
- Produces: Clean card components without static decorative badges, and catalog pages without simulated telemetry.

- [ ] **Step 1: Update failing tests for DoctorCard, ServiceCard, and Services directory**

In `src/components/clinical/__tests__/clinical-primitives.test.tsx`:
1. Verify `DoctorCard` no longer renders decorative static badge «پزشک تایید شده».
2. Verify `ServiceCard` no longer renders decorative badge «خدمت تخصصی».

In `src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`:
1. Verify `ServicesPage` renders clean categories and cards without the fake 82% capacity widget.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/components/clinical/__tests__/clinical-primitives.test.tsx src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`
Expected: FAIL on the updated assertions.

- [ ] **Step 3: Implement de-slop in cards and catalog pages**

1. `src/components/catalog/doctor-card.tsx`:
   - Remove static badge «پزشک تایید شده».
   - Keep physician name, specialty, medical council code (`نظام پزشکی`), clinic name, next slot, and rating.
   - Refine booking CTA button: `«مشاهده نوبت‌ها»` with `aria-label="رزرو نوبت حضوری"`.
2. `src/components/catalog/service-card.tsx`:
   - Remove redundant «خدمت دارای تاییدیه بالینی» badge.
   - Keep category, duration, provider name, and transparent fee.
3. `src/app/[locale]/(discovery)/services/page.tsx`:
   - **Surgical Removal**: Delete the fake "ظرفیت‌های فعال امروز" widget with its pulsing ping dot and hardcoded 82% progress bar.
   - Simplify hero header: `«خدمات درمانی و تشخیصی»` with calm description.
   - Keep clean category tabs (`همه`, `چکاپ و آزمایش`, `تصویربرداری`, `تغذیه و رژیم`, `توانبخشی`).
4. `src/app/[locale]/(discovery)/doctors/page.tsx`:
   - Remove decorative kickers; streamline filter chips.
5. `src/app/[locale]/(discovery)/search/page.tsx`:
   - Clean up result counts and filter pills.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/components/clinical/__tests__/clinical-primitives.test.tsx src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/catalog/doctor-card.tsx src/components/catalog/service-card.tsx src/app/[locale]/(discovery)/services/page.tsx src/app/[locale]/(discovery)/doctors/page.tsx src/app/[locale]/(discovery)/search/page.tsx src/components/clinical/__tests__/clinical-primitives.test.tsx src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx
git commit -m "feat(catalog): strip fake capacity widget and redundant badges from cards"
```

---

### Task 4: Booking Flow & Detail Pages Humanization

**Files:**
- Modify: `src/app/[locale]/(discovery)/services/[slug]/page.tsx`
- Modify: `src/app/[locale]/(discovery)/doctors/[slug]/page.tsx`
- Modify: `src/components/booking/slot-picker.tsx`
- Modify: `src/app/[locale]/(booking)/confirm/page.tsx`
- Test: `src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`

**Interfaces:**
- Consumes: Catalog and booking queries (`getService`, `getPrepInfo`, `getDoctor`)
- Produces: Medically accurate service detail page without fake laboratory tables, clean doctor dossier, and decluttered digital receipt.

- [ ] **Step 1: Update failing tests for Service Detail and Receipt**

In `src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`:
1. Verify `ServicePage` renders preparation guidance with accessible `aria-label="Book this service"` on the booking link and clean Persian text `«رزرو نوبت حضوری»`.
2. Verify that the hardcoded `LAB_PARAMETERS` table is no longer rendered indiscriminately.
3. Verify `ConfirmPage` renders clean receipt without pulsing status dots.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement changes in detail pages and booking components**

1. `src/app/[locale]/(discovery)/services/[slug]/page.tsx`:
   - **Delete Hardcoded Table**: Remove `LAB_PARAMETERS` array and the table section rendering FBS, HbA1c, HOMA-IR for all diagnostic services.
   - Humanize button copy: Change `<span>رزرو آنلاین نوبت (Book this service)</span>` to `<span>رزرو نوبت حضوری</span>` with `aria-label="Book this service"` (maintaining e2e journey compatibility).
   - Humanize preparation header: Change `راهنمای آمادگی قبل از خدمت (Preparation)` to `«راهنمای آمادگی مراجعه»` with `<span className="sr-only">Preparation</span>` or subtle subtitle.
   - Clean up metrics bento row and clinic address card.
2. `src/app/[locale]/(discovery)/doctors/[slug]/page.tsx`:
   - Remove fake "هم‌اکنون آنلاین" pulsing green indicator.
   - Clean section headers for credentials, clinic locations, and available slots.
3. `src/components/booking/slot-picker.tsx`:
   - Clean day selector and morning/evening slots without redundant micro-labels.
   - Ensure button retains `aria-label="Confirm booking"` with human Persian text `«تایید نهایی نوبت»`.
4. `src/app/[locale]/(booking)/confirm/page.tsx`:
   - Clean digital receipt: Remove pulsing status dots and redundant security badges.
   - Retain clear reservation details (tracking code, date/time, clinic address, instructions).

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/[locale]/(discovery)/services/[slug]/page.tsx src/app/[locale]/(discovery)/doctors/[slug]/page.tsx src/components/booking/slot-picker.tsx src/app/[locale]/(booking)/confirm/page.tsx src/app/[locale]/(discovery)/__tests__/discovery-booking.test.tsx
git commit -m "feat(booking): remove hardcoded lab table and humanize service detail and receipt"
```

---

### Task 5: Nutrition Hub & Metabolic Tools Humanization

**Files:**
- Modify: `src/components/clinical/metabolism-calculator.tsx`
- Modify: `src/app/[locale]/(nutrition)/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/body/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/diet/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/foods/page.tsx`
- Modify: `src/app/[locale]/(nutrition)/foods/[id]/page.tsx`
- Test: `src/components/clinical/__tests__/metabolism-calculator.test.tsx`
- Test: `src/app/[locale]/(nutrition)/__tests__/nutrition.test.tsx`

**Interfaces:**
- Consumes: `getPhysiology`, `dayIntake`, `calculateBmi`, `calculateMacros`, `listPrograms`
- Produces: Nutrition hub with real intake rendering (or clean empty state), humanized calculator labels, and realistic diet plan descriptions.

- [ ] **Step 1: Update failing tests for Nutrition Hub and Metabolism Calculator**

In `src/components/clinical/__tests__/metabolism-calculator.test.tsx`:
1. Check gender labels `آقا` and `خانم` (without bracketed `(مرد)` / `(زن)`).
2. Check result header `نتایج محاسبه سوخت‌وساز` instead of `خروجی فیزیولوژیک زنده`.
3. Check CTA button `ثبت در دفترچه تغذیه`.

In `src/app/[locale]/(nutrition)/__tests__/nutrition.test.tsx`:
1. Verify that `NutritionHomePage` renders real logged items when present in `dayIntake` (e.g. `آش رشته`), and renders a clean empty state prompt when `intakes` is empty.
2. Verify removal of fake precision stats from `diet/page.tsx`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/components/clinical/__tests__/metabolism-calculator.test.tsx src/app/[locale]/(nutrition)/__tests__/nutrition.test.tsx`
Expected: FAIL on updated assertions.

- [ ] **Step 3: Implement Nutrition Hub humanization**

1. `src/components/clinical/metabolism-calculator.tsx`:
   - Change gender radio labels to clean `«آقا»` and `«خانم»`.
   - Change input labels: `«قد (سانتی‌متر)»`, `«وزن (کیلوگرم)»`, `«سن (سال)»`.
   - Replace technical `PAL` multiplier with clear descriptive activity levels: `«کم‌تحرک (کارمندی)»`, `«فعالیت ملایم (۱ تا ۳ روز در هفته)»`, `«ورزش منظم»`, `«ورزشکار حرفه‌ای»`.
   - Change result heading to `«نتایج محاسبه سوخت‌وساز»`.
   - Change CTA button to `«ثبت در دفترچه تغذیه»`.
2. `src/app/[locale]/(nutrition)/page.tsx`:
   - **Eliminate Fake Telemetry**: When `intakeData.intakes` is empty or 0, do NOT fallback to `1450` kcal or hardcode سنگک/قورمه‌سبزی! Consumed calories should be `0` with an intuitive empty state:
     `«امروز وعده‌ای ثبت نشده است. با ثبت اولین وعده، نمودار تراز درشت‌مغذی‌ها و کالری مصرفی شما فعال می‌شود.»` with quick CTA: `«ثبت اولین وعده»`.
   - When meals exist, render the user's actual logged meals dynamically.
3. `src/app/[locale]/(nutrition)/body/page.tsx`:
   - Clean up biometric input cards; remove redundant micro-labels.
4. `src/app/[locale]/(nutrition)/diet/page.tsx`:
   - Remove fake precision stats (`«۹۴٪ بهبود شاخص HOMA-IR»` and `«۱۲،۴۰۰+ پرونده فعال»`).
   - Remove development artifact strings like `(clinics)` from dropdown values.
5. `src/app/[locale]/(nutrition)/foods/page.tsx` & `[id]/page.tsx`:
   - Streamline table headers and portion unit selectors (`کف دست`, `لیوان`, `قاشق`, `بشقاب`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/components/clinical/__tests__/metabolism-calculator.test.tsx src/app/[locale]/(nutrition)/__tests__/nutrition.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/clinical/metabolism-calculator.tsx src/app/[locale]/(nutrition)/page.tsx src/app/[locale]/(nutrition)/body/page.tsx src/app/[locale]/(nutrition)/diet/page.tsx src/app/[locale]/(nutrition)/foods/page.tsx src/app/[locale]/(nutrition)/foods/[id]/page.tsx src/components/clinical/__tests__/metabolism-calculator.test.tsx src/app/[locale]/(nutrition)/__tests__/nutrition.test.tsx
git commit -m "feat(nutrition): eliminate fake meal telemetry, humanize calculator, and clean diet plans"
```

---

### Task 6: Content Hub & Care Pathways De-Slop

**Files:**
- Modify: `src/app/[locale]/(content)/articles/page.tsx`
- Modify: `src/app/[locale]/(content)/articles/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/topics/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/conditions/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/videos/page.tsx`
- Modify: `src/app/[locale]/(content)/faq/faq-client.tsx`
- Test: `src/app/[locale]/(content)/__tests__/content-hub.test.tsx`

**Interfaces:**
- Consumes: Content queries (`listContent`, `getContentBySlug`, `getTopic`, `getCondition`)
- Produces: High-quality editorial health magazine and care pathway pages without decorative kickers or duplicate symptom boxes.

- [ ] **Step 1: Update failing tests for Content Hub**

In `src/app/[locale]/(content)/__tests__/content-hub.test.tsx`:
1. Verify article headers render without redundant «دانشنامه سلامت» kicker badges.
2. Verify topic pathways render clean article and specialist links without fake telemetry cards.
3. Verify video cards render without repetitive «ویدیوی تایید شده» tags.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/app/[locale]/(content)/__tests__/content-hub.test.tsx`
Expected: FAIL on updated assertions.

- [ ] **Step 3: Implement Content Hub humanization**

1. `src/app/[locale]/(content)/articles/page.tsx` & `[slug]/page.tsx`:
   - Remove redundant kicker tags above article titles.
   - Reader view: Highlight editorial typography, reading time, author credentials, and relevant clinical services.
2. `src/app/[locale]/(content)/topics/[slug]/page.tsx`:
   - Remove fake static "شاخص‌های هدف بالینی" card.
   - Present natural pathway: Topic overview, articles, related physicians, and diagnostic tests.
3. `src/app/[locale]/(content)/conditions/[slug]/page.tsx`:
   - Remove identical copy-pasted diagnostic boxes; render tailored condition description, linked services, and doctors.
4. `src/app/[locale]/(content)/videos/page.tsx`:
   - Remove redundant «ویدیوی تایید شده» badge from every video thumbnail.
   - Focus on video duration, speaker name, and topic.
5. `src/app/[locale]/(content)/faq/faq-client.tsx`:
   - Clean up category tabs and FAQ accordion styling.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/app/[locale]/(content)/__tests__/content-hub.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/[locale]/(content)/articles/page.tsx src/app/[locale]/(content)/articles/[slug]/page.tsx src/app/[locale]/(content)/topics/[slug]/page.tsx src/app/[locale]/(content)/conditions/[slug]/page.tsx src/app/[locale]/(content)/videos/page.tsx src/app/[locale]/(content)/faq/faq-client.tsx src/app/[locale]/(content)/__tests__/content-hub.test.tsx
git commit -m "feat(content): de-slop health magazine, topic care pathways, and FAQ accordion"
```

---

### Task 7: Account, Notifications & Translation Parity

**Files:**
- Modify: `src/app/[locale]/(account)/appointments/page.tsx`
- Modify: `src/app/[locale]/(account)/notifications/page.tsx`
- Modify: `src/components/layout/admin-shell.tsx`
- Modify: `messages/fa.json`
- Modify: `messages/en.json`
- Modify: `messages/ar.json`
- Test: `src/app/[locale]/(account)/__tests__/account.test.tsx`

**Interfaces:**
- Consumes: Identity queries, next-intl translations
- Produces: Streamlined patient account views, clean admin layout, and updated 3-locale translation dictionaries.

- [ ] **Step 1: Update failing tests for Account and Notifications**

In `src/app/[locale]/(account)/__tests__/account.test.tsx`:
1. Verify appointment cards render clean status badges (`رزرو شده`, `انجام شده`, `لغو شده`) without decorative micro-tags.
2. Verify notifications render clean timestamps without pulsing radar dots.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/app/[locale]/(account)/__tests__/account.test.tsx`
Expected: FAIL on updated assertions.

- [ ] **Step 3: Implement Account, Admin, and Translation cleanup**

1. `src/app/[locale]/(account)/appointments/page.tsx`:
   - Clean card layout: Date/time, doctor/service name, clinic address, and action buttons.
2. `src/app/[locale]/(account)/notifications/page.tsx`:
   - Remove decorative pulsing dots; use clean unread indicators.
3. `src/components/layout/admin-shell.tsx`:
   - Remove decorative micro-tags from sidebar; ensure clean table headers.
4. `messages/fa.json`, `en.json`, `ar.json`:
   - Update all translation keys corresponding to removed kickers or humanized copy.
   - Maintain key parity across all 3 locales (`fa`, `en`, `ar`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test src/app/[locale]/(account)/__tests__/account.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/[locale]/(account)/appointments/page.tsx src/app/[locale]/(account)/notifications/page.tsx src/components/layout/admin-shell.tsx messages/fa.json messages/en.json messages/ar.json src/app/[locale]/(account)/__tests__/account.test.tsx
git commit -m "feat(account): refine appointments and notifications, update translation catalogs"
```

---

### Task 8: Full Platform Verification & Build Audit

**Files:**
- None (verification phase)

**Commands:**
- [ ] **Step 1: Run TypeScript typecheck**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run Linter**

Run: `bun run lint`
Expected: 0 errors (only known `no-await-in-loop` warnings in catalog actions).

- [ ] **Step 3: Run Full Vitest Test Suite**

Run: `bun run test`
Expected: All unit tests pass across all subsystems.

- [ ] **Step 4: Run Next.js Production Build**

Run: `bun run build`
Expected: All 108 App Router routes compile successfully with 0 build errors.

- [ ] **Step 5: Final Commit & Tagging**

```bash
git status
git commit --allow-empty -m "chore(release): verify full platform UI de-slop and humanization"
```
