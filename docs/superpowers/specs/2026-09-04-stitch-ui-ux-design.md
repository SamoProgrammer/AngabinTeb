# Angabin Teb — UI/UX Design Specification (Google Stitch Integration)

**Date:** 2026-09-04  
**Status:** Approved  
**Reference Stitch Project:** [Stitch Project 2835568483852518005](https://stitch.withgoogle.com/projects/2835568483852518005)  
**Target Platform:** Next.js 16.3.3 App Router, React 19, Tailwind CSS v4, Bun, next-intl, Drizzle ORM  

---

## 1. Executive Summary & Design Vision

This specification defines the complete UI/UX modernization of the **Angabin Teb** Persian clinical health and nutrition platform. The visual and interactive experience is derived directly from the exported Google Stitch project comprising 50 designed screens.

### Design Movement: Modern Clinical Humanism
The interface marries structured Swiss medical precision with Persian warmth and organic clinical vitality. "Angabin" (persian wild honey and manna) evokes balanced nourishment and regenerative vitality. The design strictly rejects cold institutional sterility and generic AI templates in favor of:
- Deep, reassuring clinical emeralds and warm amber accents.
- Soft porcelain layered surfaces with ambient light diffusion.
- Persian-first typography with diacritic-safe line-heights and native Right-to-Left (RTL) directional harmony.
- Clear clinical hierarchy with upfront pricing ("پرداخت در مطب"), verified physician badges, and zero hidden platform fees.

---

## 2. Design System Tokens & Foundations

### 2.1 Color Palette
The colors are calibrated for high clinical contrast and WCAG 2.1 AA/AAA compliance:

```css
@theme inline {
  /* Primary Clinical Emerald */
  --color-primary: #005f4c;
  --color-primary-container: #0d7a63;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #a9ffe3;
  --color-primary-fixed: #98f4d7;
  --color-primary-fixed-dim: #7cd7bc;

  /* Secondary Warm Honey / Amber */
  --color-secondary: #904d00;
  --color-secondary-container: #fe932c;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #663500;
  --color-secondary-fixed: #ffdcc3;
  --color-secondary-fixed-dim: #ffb77d;

  /* Tertiary Clinical Mint / Telemetry */
  --color-tertiary: #005f54;
  --color-tertiary-container: #007a6d;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #a7ffef;
  --color-tertiary-fixed: #62fae3;
  --color-tertiary-fixed-dim: #3cddc7;

  /* Neutral Surfaces & Porcelain Layers */
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

  /* Text & Contrast */
  --color-on-surface: #131b2e;
  --color-on-surface-variant: #3e4945;
  --color-inverse-surface: #283044;
  --color-inverse-on-surface: #eef0ff;

  /* Outlines & Borders */
  --color-outline: #6e7a75;
  --color-outline-variant: #bdc9c3;

  /* Error & Clinical Alerts */
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error: #ffffff;
  --color-on-error-container: #93000a;
}
```

### 2.2 Elevation & Shadow Layers
- **Tier 0 (Base Canvas):** Warm porcelain (`#FAF8FF`), flat.
- **Tier 1 (Cards, Modules, Clinical Tiles):** Crisp pure white (`#FFFFFF`) with 1px border (`#E2E8F0`) and diffused shadow:
  `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02);`
- **Tier 2 (Active Filters, Interactive Hover States):** Luminous emerald/slate tint:
  `box-shadow: 0 10px 25px -4px rgba(10, 92, 74, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03);`
- **Tier 3 (Floating Overlays, Modals, Drawers):** Grounded elevation:
  `box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(226, 232, 240, 0.8);`
- **Frosted Glass (Sticky Headers & Metric Bars):** `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(12px)`.

### 2.3 Typography Stack
- **Font Definition:** Configured via `next/font/google` in `src/app/fonts.ts`:
  - **Vazirmatn**: Persian and Arabic default font (weights 400, 500, 600, 700, 800) with a 25% increased vertical line-height to prevent character ascender/descender collisions with Persian vowels and tashkeel.
  - **Plus Jakarta Sans**: Latin fallback font for ICD-10 medical codes, laboratory test IDs, and western numeric telemetry.
- **Type Scale:**
  - `display-hero`: 40px / line-height 56px, weight 800
  - `display-hero-mobile`: 28px / line-height 40px, weight 800
  - `headline-lg`: 32px / line-height 46px, weight 700
  - `headline-md`: 22px / line-height 34px, weight 700
  - `headline-sm`: 18px / line-height 28px, weight 600
  - `title-md`: 16px / line-height 26px, weight 600
  - `body-lg`: 16px / line-height 28px, weight 400
  - `body-md`: 14px / line-height 24px, weight 400
  - `label-md`: 13px / line-height 20px, weight 600
  - `label-sm`: 11px / line-height 16px, weight 500
  - `data-metric`: 26px / line-height 32px, weight 700

### 2.4 Iconography System
- Standard Google **Material Symbols Outlined** font linked in `LocaleLayout`.
- Hybrid `<ClinicalIcon name="..." size={20} fill={false} className="..." />` component supporting direct glyph names (`stethoscope`, `local_hospital`, `biotech`, `speed`, `calculate`, `verified`, `menu_book`, `ecg`, `water_drop`, etc.) and optional Lucide fallback.

---

## 3. Component Architecture & Reusability

### 3.1 Global Chrome (`src/components/layout/`)
1. **`ClinicalHeader`**:
   - Brand logo with medical cross badge, "انگبین طب" title, and subtitle "سامانه سلامت و تغذیه بالینی".
   - Navigation links: نوبت‌دهی پزشکان, خدمات درمانی و پاراکلینیک, پرونده و تغذیه, مجله سلامت, درباره ما, تماس با ما.
   - Active route styling with `bg-primary/10 text-primary`.
   - Language selector pill (`FA`, `EN`, `AR`).
   - Hotline quick-call badge: `پشتیبانی فوری: ۰۲۱-۸۸۲۲۴۰۰۰`.
   - Patient authentication CTA: `ورود / پرونده من`.
2. **`ClinicalFooter`**:
   - Emergency banner: *«توجه: انگبین طب سامانه اعزام اورژانس پزشکی نیست. در شرایط بحرانی با ۱۱۵ تماس بگیرید.»*
   - Verified booking guarantee: *«تمامی نوبت‌های پزشکی بدون اخذ کارمزد آنلاین و با پرداخت حضوری در مطب رزرو می‌شوند.»*
   - 4-column clinical link sitemap (دسترسی سریع, خدمات بالینی, پایگاه دانش و مقالات, مجوزها و اعتبارسنجی).
   - Ministry of Health and Medical Council trust badges.
3. **`MobileNav`**:
   - Persistent bottom app bar on viewports `< 768px` for one-thumb clinical navigation.

### 3.2 Clinical Domain Components (`src/components/clinical/`)
1. **`UniversalSearchBar`**:
   - 4-way filter pills (*پزشکان و متخصصان*, *خدمات پاراکلینیک*, *رژیم و کالری‌شمار*, *مقالات سلامت*).
   - RTL search input with dynamic placeholder text, microphone icon, and submit button.
   - Quick guarantee chips below search bar.
2. **`DoctorCard`**:
   - Verified avatar, physician name, medical council registration code (*شماره نظام پزشکی*), specialty, and academic appointments.
   - Star rating pill (`۴.۹ (۲۴۰)`).
   - Next available slot chip (`فردا ساعت ۱۰:۳۰`), clinic location, approved fee (`۲۵۰,۰۰۰ تومان`).
   - Pay-at-clinic booking CTA button.
3. **`ServiceCard`**:
   - Diagnostic category chip (آزمایشگاه, تصویربرداری, آنالیز بدن, کلینیک تغذیه).
   - Fasting/preparation guidelines with warning icon.
   - Execution duration chip and approved fee.
4. **`MetabolismCalculator`**:
   - Client component with real-time reactive Mifflin-St Jeor equation.
   - Gender toggle, numeric inputs (سن, قد, وزن), and daily activity dropdown.
   - Live gradient card displaying calculated BMR, TDEE, and BMI with classification badges.
   - Direct CTA into the Persian food diary.
5. **`TrustMetrics`**:
   - Big metrics row (+120 physicians, +45,000 appointments, +800 Persian foods, 100% pay-at-clinic).
   - 3 trust pillars (حفاظت از پرونده بالینی, شفافیت مالی, همراهی بیمار).
6. **`ArticleCard` & `VideoCard`**:
   - Article thumbnail, topic pill, physician author, read duration.
   - Video card with duration tag, play overlay, and clinical summary.
7. **`AdminShell`**:
   - Unified administrative shell with collapsible sidebar, breadcrumb header, search filter, and responsive table wrapper.

---

## 4. App Router Page Transformations

| Route | Stitch Screen Reference | Primary Layout Components |
|---|---|---|
| `/` (Home) | Screen #13 (`823cf9f2...`), Mobile #43 | Ambient Hero, `UniversalSearchBar`, 5 Action Cards, Featured Doctors, Services Showcase, `MetabolismCalculator`, Articles/Videos, `TrustMetrics` |
| `/doctors` | Screen #7 (`57645f21...`), Mobile #18 | Doctor filter sidebar, search input, `DoctorCard` grid, pagination |
| `/doctors/[slug]` | Screen #37 (`e964d92a...`) | Doctor dossier, medical credentials, clinic locations, slot selector |
| `/services` | Screen #39 (`147ed86e...`) | Paraclinical category tabs, `ServiceCard` grid, preparation instructions |
| `/services/[slug]` | Screen #3 (`e567fe1b...`) | Test instructions, fasting warnings, clinic schedule, booking CTA |
| `/services/[slug]/book` | Screen #8 (`ea48f344...`) | Calendar slot picker, time chips, zero online fee notice |
| `/confirm` | Screen #20 (`61727d27...`) | Digital appointment receipt, clinic address, SMS reminder note |
| `/search` | Screen #21 (`793ae0e0...`) | Faceted universal search results (doctors, services, articles, foods) |
| `/nutrition` | Screen #14 (`20306ca3...`) | Nutrition hub dashboard, BMR shortcut, food diary widget, diet plans |
| `/nutrition/body` | Screen #41 (`73273656...`) | Biometric body profile, BMR calculator, BMI history |
| `/nutrition/diary` | Screen #11 (`2d68c123...`), Mobile #27 | Persian meal logger with traditional units (کفگیر, پیاله, قاشق), macro bars |
| `/nutrition/diet` | Screens #16, #24, #26 | Clinical diet packages (Fatty Liver, Gout, Diabetes, Metabolic Health) |
| `/nutrition/foods` & `[id]`| Screens #36, #17 | Persian food dictionary & nutrient breakdown per serving |
| `/articles` & `[slug]` | Screen #42 (`d86f7b66...`) | Clinical knowledge base, article reader with physician author bio |
| `/topics` & `[slug]` | Screens #2, #28 (`11e88f07...`) | Health topics index and 360-degree condition hub (Diabetes 360) |
| `/videos` | Screen #47 (`f6ef21cc...`) | Educational video lecture hall |
| `/conditions/[slug]` | Screen #48 (`4e1076b6...`) | Medical conditions and symptom directory |
| `/faq` | Screen #29 (`66b5e4f1...`) | Clinical FAQs and patient policy accordions |
| `/appointments` | Screen #31 (`38713aef...`) | Patient visits list, status badges, directions |
| `/notifications` | Screen #10 (`2d1d0777...`) | Patient reminders and clinical alerts |
| `/support` | Screens #1, #9, #50 | Ticket submission form and status tracker |
| `/about` | Screens #22, #33 | Mission statement, medical credentials, scientific board |
| `/contact` | Screen #44 (`47a010cf...`) | Contact channels, clinic branches directory |
| `/admin/*` | Screens #4, #5, #6, #19, #32, #34, #35, #38, #40, #46, #49 | Unified `AdminShell` managing providers, services, slots, foods, diets, content, and support triage |

---

## 5. Seed Data & Persona Synchronization

To ensure live database queries render realistic clinical content, the database seed scripts (`scripts/seed*.ts`) will be aligned with the Stitch design personas:
- **Physicians:**
  - *Dr. Leila Sadat* (Endocrinologist & Diabetes Specialist — نظام پزشکی: ۱۱۲۴۵)
  - *Dr. Arash Radmanesh* (Clinical Nutritionist & Obesity Fellow — نظام پزشکی: ۲۴۸۹۰)
  - *Dr. Sara Mahdavi* (Cardiologist & Echocardiography Specialist — نظام پزشکی: ۳۱۵۶۷)
  - *Dr. Payam Bahrami* (Gastroenterologist & Hepatologist — نظام پزشکی: ۱۸۷۶۴)
- **Services:**
  - *چکاپ جامع متابولیک و قند ناشتا* (480,000 Toman, 10h fasting)
  - *آنالیز ترکیب بدن InBody* (190,000 Toman, no fasting)
  - *مشاوره تخصصی رژیم غذایی بومی* (350,000 Toman)
  - *اکوکاردیوگرافی داپلر و نوار قلب* (620,000 Toman)
- **Foods & Serving Units:**
  - *چلو کته زعفرانی* (کفگیر, 250 kcal)
  - *ته‌چین مرغ سنتی* (برش, 420 kcal)
  - *قورمه‌سبزی با گوشت گوسفندی* (ملاقه, 310 kcal)
  - *ماست و خیار نعنایی* (پیاله, 95 kcal)
- **Articles & Topics:**
  - *راهنمای بالینی کنترل کبد چرب گرید ۱ و ۲ با اصلاح سفره غذایی ایرانی*
  - *چگونه کالری پلوهای سنتی را دقیق ثبت کنیم؟*
  - *نشانه‌های اولیه مقاومت به انسولین چیست؟*

---

## 6. Implementation & Verification Plan

### Phase 1: Tokens, Fonts & Layout Chrome
1. Configure `@theme` in `src/app/globals.css`.
2. Setup `src/app/fonts.ts` for Vazirmatn and Plus Jakarta Sans.
3. Build `ClinicalIcon`, `ClinicalHeader`, `ClinicalFooter`, and `MobileNav`.
4. Wrap `LocaleLayout` with global chrome and fonts.

### Phase 2: Shared Components & Modern Landing Page
1. Build `UniversalSearchBar`, `DoctorCard`, `ServiceCard`, `MetabolismCalculator`, `ArticleCard`, `VideoCard`, and `TrustMetrics`.
2. Reconstruct `src/app/[locale]/page.tsx` matching Stitch Screen #13.

### Phase 3: Discovery & Booking Overhaul
1. Modernize `/doctors` and `/doctors/[slug]`.
2. Modernize `/services` and `/services/[slug]`.
3. Modernize `/services/[slug]/book` and `/confirm`.
4. Modernize `/search`.

### Phase 4: Nutrition & Content Hubs
1. Modernize `/nutrition`, `/nutrition/body`, `/nutrition/diary`, `/nutrition/diet`, and `/nutrition/foods`.
2. Modernize `/articles`, `/topics`, `/videos`, `/conditions`, and `/faq`.

### Phase 5: Account, Support, Marketing & Admin
1. Modernize `/appointments`, `/notifications`, `/support`.
2. Modernize `/about`, `/contact`.
3. Implement `AdminShell` and update all `/admin/*` routes.
4. Update seed scripts to populate the enriched clinical personas.

### Phase 6: Automated Verification & Sign-off
1. `bunx tsc --noEmit` — 0 errors.
2. `bun run lint` — 0 errors.
3. `bunx vitest run src/` — 31/31 tests passing.
4. `bun run build` — Clean production build.
5. Visual validation across Persian (`fa`), English (`en`), and Arabic (`ar`).
