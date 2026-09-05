# Angabin Teb — UI De-Slop & Platform-Wide Humanization Design Specification

**Date:** 2026-09-05  
**Status:** Approved  
**Target Platform:** Next.js 16.3.3 App Router, React 19, Tailwind CSS v4, Bun, next-intl, Drizzle ORM  
**Reference Design:** Google Stitch 50-Screen System (`docs/superpowers/specs/2026-09-04-stitch-ui-ux-design.md`)  

---

## 1. Executive Summary & Philosophy

The Google Stitch integration established a comprehensive visual design system for Angabin Teb, including a Persian Clinical Wellness palette, Vazirmatn typography, elevation tokens, and 50 screens. However, the direct porting of AI-generated design artifacts introduced persistent AI design anti-patterns:
- **Visual noise & micro-label fatigue**: Redundant eyebrow tags (kickers) above almost every heading explaining what the heading already states.
- **Fake telemetry & synthetic widgets**: Simulated progress bars (e.g. 82% daily capacity), hardcoded biochemical laboratory parameter tables on services where they are medically irrelevant, and fake pre-filled food logs (e.g. 1450 kcal, سنگک and قورمه‌سبزی) for new users.
- **Static badge inflation**: Repetitive pills asserting «تایید بالینی», «پرداخت در مطب», or pulsing radar dots in non-realtime contexts.
- **Robotic, roboticized Persian copy**: Literal translations with English parentheticals (e.g. `آقا (مرد)`, `رزرو آنلاین نوبت (Book this service)`, `راهنمای آمادگی (Preparation)`, `ضریب PAL`).

### The Humanization Standard
Every screen on Angabin Teb must feel handcrafted by senior clinical product designers and Iranian healthcare practitioners. We adhere to five core humanization principles:

1. **Typographic Self-Sufficiency**: Clear H1/H2 headlines and succinct subheaders speak for themselves. Strip redundant kicker tags and eyebrow micro-labels.
2. **Honest Data or Elegant Emptiness**: Show real data when available. If no user data exists, render an encouraging, intuitive empty state—never fake telemetry, simulated percentages, or mock meal logs.
3. **Intentional Badges**: Badges are reserved exclusively for dynamic, actionable states (`ظرفیت تکمیل`, `نوبت حضوری`, `لغو شده`, `تایید نهایی`). Static truisms and decorative badges are removed.
4. **Natural, Culturally Fluent Persian**: Natural, dignified medical and lifestyle Persian without machine-translated jargon, English remnants, or redundant parenthetical definitions.
5. **Calm Clinical Rhythm**: Generous whitespace, single-level cards, clear visual affordances, and zero non-functional decorative controls (e.g. fake mic buttons).

---

## 2. Platform-Wide Audit & Component Changes

### 2.1 Global Chrome & Universal Search

#### Files Modified:
- `src/components/layout/clinical-header.tsx`
- `src/components/layout/clinical-footer.tsx`
- `src/components/clinical/universal-search-bar.tsx`

#### Design Directives:
- **`clinical-header.tsx`**:
  - Remove redundant micro-badges inside mega-dropdown menus (e.g. «جدید», «ویژه»).
  - Keep menu categories focused: «پزشکان و متخصصان»، «خدمات درمانی و تشخیصی»، «برنامه‌ها و ابزارهای تغذیه»، «دانشنامه و مقالات سلامت».
  - Maintain reactive session state (`authClient.useSession()`) with clean avatar/account triggers.
- **`clinical-footer.tsx`**:
  - Remove decorative kicker labels above link columns.
  - Simplify trust seals and accreditation notices into a cohesive, quiet bottom bar.
  - Maintain the emergency 115 alert banner and zero-commission guarantee in clean, uncluttered cards.
- **`universal-search-bar.tsx`**:
  - Remove the non-functional voice/microphone icon button that does nothing when clicked.
  - Remove decorative pill «جستجوی هوشمند» in the header/trigger.
  - Refine input placeholder: `«جستجوی نام پزشک، تخصص، خدمت درمانی یا مقاله سلامت...»`.
  - Streamline quick-filter pills below the search bar to 4 primary intents: `«پزشکان»`, `«خدمات تشخیصی»`, `«محاسبه سوخت‌وساز»`, `«رژیم دیابت»`.

---

### 2.2 Landing Page (`src/app/[locale]/page.tsx`)

#### Sections Addressed:
1. **Hero Section**:
   - Remove `heroBadge` («پلتفرم تخصصی سلامت و تغذیه ایرانیان»).
   - Main headline: `«مرجع نوبت‌دهی پزشکی، خدمات سلامت و تغذیه بالینی»`.
   - Subtitle: `«دسترسی آسان به پزشکان متخصص، مراکز درمانی معتبر و برنامه‌های شخصی‌سازی‌شده سوخت‌وساز بدن»`.
   - Remove micro-telemetry dots from the search card header.
2. **Clinical Systems / Care Pathways**:
   - Remove `systemsKicker` («مسیرهای مراقبت ۳۶۰ درجه»).
   - Section heading: `«مراقبت تخصصی سلامت بر اساس نیاز شما»`.
3. **Doctor Spotlight**:
   - Remove `doctorsKicker` («کادر درمان معتبر»).
   - Section heading: `«پزشکان و متخصصان برجسته»`.
4. **Clinical Services**:
   - Remove `servicesKicker` («خدمات بالینی و پاراکلینیکی»).
   - Section heading: `«خدمات تشخیصی و درمانی»`.
5. **Knowledge & Magazine**:
   - Remove `knowledgeKicker` («دانشنامه سلامت و سبک زندگی»).
   - Section heading: `«تازه‌ترین مقالات و آموزش‌های پزشکی»`.
6. **Trust Metrics & Accreditation**:
   - Replace generic AI badges with clean, authoritative stats: `«بیش از ۵۰ پزشک متخصص»`, `«پرداخت مستقیم در مطب»`, `«پشتیبانی روزانه بیماران»`.

---

### 2.3 Discovery & Catalogs (`doctors`, `services`, `search`)

#### Files Modified:
- `src/app/[locale]/(discovery)/doctors/page.tsx`
- `src/app/[locale]/(discovery)/services/page.tsx`
- `src/app/[locale]/(discovery)/search/page.tsx`
- `src/components/catalog/doctor-card.tsx`
- `src/components/catalog/service-card.tsx`

#### Design Directives:
- **`services/page.tsx`**:
  - **Surgical Removal**: Remove the fake "ظرفیت‌های فعال امروز" widget with its pulsing dot and synthetic 82% progress bar. Real slot availability is surfaced inside individual service and doctor slot pickers.
  - Simplify header: `«خدمات درمانی و تشخیصی»` with concise description.
  - Clean category tabs (`همه`, `چکاپ و آزمایش`, `تصویربرداری`, `تغذیه و رژیم`, `توانبخشی`).
- **`doctors/page.tsx`**:
  - Remove decorative kicker tags.
  - Streamline specialty filter chips and sort dropdowns.
- **`doctor-card.tsx`**:
  - Remove static pill «پزشک تایید شده» (all listed doctors are verified by default).
  - Keep high-value information: Physician name, medical council code (`نظام پزشکی`), primary specialty, clinic/hospital affiliation, and next available appointment slot.
  - Refine booking CTA: `«مشاهده نوبت‌ها»`.
- **`service-card.tsx`**:
  - Remove redundant «خدمت دارای تاییدیه بالینی» badge.
  - Keep category tag, estimated duration (`زمان تقریبی`), clear fee with «پرداخت در مطب» label, and direct action button: `«جزئیات و نوبت‌دهی»`.

---

### 2.4 Booking Flow & Detail Pages

#### Files Modified:
- `src/app/[locale]/(discovery)/doctors/[slug]/page.tsx`
- `src/app/[locale]/(discovery)/services/[slug]/page.tsx`
- `src/components/booking/slot-picker.tsx`
- `src/app/[locale]/(booking)/confirm/page.tsx`

#### Design Directives:
- **`services/[slug]/page.tsx`**:
  - **Critical Clinical Fix**: Eliminate the hardcoded `LAB_PARAMETERS` table that renders Fasting Blood Sugar (FBS), HbA1c, and HOMA-IR indiscriminately across services like Ultrasound, MRI, and InBody consultations.
  - Replace with dynamic service attributes: Service description, clinical indications, preparation requirements, and service hours.
  - Fix leaked English strings:
    - `"رزرو آنلاین نوبت (Book this service)"` → `«رزرو نوبت»`
    - `"راهنمای آمادگی قبل از خدمت (Preparation)"` → `«راهنمای آمادگی مراجعه»`
    - `"پوشش بیمه پایه و تکمیلی (Insurance)"` → `«پوشش بیمه‌ای»`
- **`doctors/[slug]/page.tsx`**:
  - Clean hero header: Remove fake "هم‌اکنون آنلاین" pulsing green indicator.
  - Clean section headers for credentials, clinic locations, and available slots.
- **`slot-picker.tsx`**:
  - Simplify calendar selector: Clear day buttons with Persian weekday names and dates.
  - Slot buckets: «نوبت‌های صبح» and «نوبت‌های عصر» without redundant micro-labels.
- **`confirm/page.tsx`**:
  - Clean digital receipt layout: Remove pulsing status dots, simulated security shields, and redundant payment method reminders.
  - Crisp reservation summary: Doctor/Service name, patient name, appointment date and time, clinic address, and clear instructions on arrival and payment at clinic.

---

### 2.5 Nutrition Hub & Tools

#### Files Modified:
- `src/components/clinical/metabolism-calculator.tsx`
- `src/app/[locale]/(nutrition)/page.tsx`
- `src/app/[locale]/(nutrition)/body/page.tsx`
- `src/app/[locale]/(nutrition)/diet/page.tsx`
- `src/app/[locale]/(nutrition)/foods/page.tsx`
- `src/app/[locale]/(nutrition)/foods/[id]/page.tsx`

#### Design Directives:
- **`metabolism-calculator.tsx`**:
  - Humanize gender labels: Change `«آقا (مرد)»` and `«خانم (زن)»` to clean `«آقا»` and `«خانم»`.
  - Humanize input labels: `«قد (سانتی‌متر)»`, `«وزن (کیلوگرم)»`, `«سن (سال)»`.
  - Simplify activity multiplier: Replace technical jargon (`ضریب PAL`) with descriptive real-life levels (`«کم‌تحرک (کارمندی)»`, `«فعالیت ملایم (۱ تا ۳ روز در هفته)»`, `«ورزش منظم»`, `«ورزشکار حرفه‌ای»`).
  - Section heading: Replace `«خروجی فیزیولوژیک زنده»` with `«نتایج محاسبه سوخت‌وساز»`.
  - Streamline CTA: Replace `«ثبت و اعمال در پرونده تغذیه بالینی من»` with `«ثبت در دفترچه تغذیه»`.
- **`nutrition/page.tsx` (Nutrition Dashboard)**:
  - **Eliminate Fake Meal Telemetry**: When a guest or newly registered user has logged 0 meals, do NOT show fake dummy data (1450 kcal, 180g carbs, and pre-filled meals: نان سنگک، پنیر لیقوان، چای، خورش قورمه‌سبزی).
  - Render an intuitive empty state:
    - If user has no meals logged today: Display a clean prompt with two clear CTAs: `«ثبت وعده غذایی»` and `«محاسبه نیاز کالری (BMR)»`.
    - If meals exist in database: Render actual logged nutrients, calories, and traditional portion units.
- **`nutrition/diet/page.tsx`**:
  - Remove fake precision statistics: `«۹۴٪ بهبود شاخص HOMA-IR»` and `«۱۲،۴۰۰+ پرونده فعال»`.
  - Fix dropdown option labels: Remove internal development identifiers like `(clinics)`.
  - Present diet plans with practical clinical focus: Diabetes care, NAFLD / Fatty liver management, Heart health, and Weight management.
- **`nutrition/foods/page.tsx` & `[id]/page.tsx`**:
  - Clean Iranian food database browser: Clear search bar, nutrient filters, and traditional household units (`کف دست`, `قاشق غذاخوری`, `لیوان`, `بشقاب`).

---

### 2.6 Content, Magazine & Care Pathways

#### Files Modified:
- `src/app/[locale]/(content)/articles/page.tsx`
- `src/app/[locale]/(content)/articles/[slug]/page.tsx`
- `src/app/[locale]/(content)/topics/[slug]/page.tsx`
- `src/app/[locale]/(content)/conditions/[slug]/page.tsx`
- `src/app/[locale]/(content)/videos/page.tsx`
- `src/app/[locale]/(content)/faq/faq-client.tsx`

#### Design Directives:
- **`articles/page.tsx` & `articles/[slug]/page.tsx`**:
  - Remove redundant «دانشنامه سلامت» kickers above every article heading.
  - Reader view: Focus on clean editorial typography, reading time, publication date, verified author/physician credentials, and related clinical services.
- **`topics/[slug]/page.tsx`**:
  - Remove static fake «شاخص‌های هدف بالینی» card.
  - Present the care pathway naturally: Topic overview, relevant articles, specialized doctors, and diagnostic services.
- **`conditions/[slug]/page.tsx`**:
  - Eliminate repetitive copy-pasted diagnostic telemetry boxes across different conditions.
  - Render clear, medically sound layout: Symptoms overview, medical guidance, recommended specialists, and diagnostic tests.
- **`videos/page.tsx`**:
  - Remove redundant «ویدیوی تایید شده» badge from every video thumbnail.
  - Focus on clear titles, video duration, and speaker/clinician name.
- **`faq/faq-client.tsx`**:
  - Clean FAQ accordion with smooth open/close, category tabs, and direct search.

---

### 2.7 Account, Notifications & Admin Console

#### Files Modified:
- `src/app/[locale]/(account)/appointments/page.tsx`
- `src/app/[locale]/(account)/notifications/page.tsx`
- `src/components/layout/admin-shell.tsx`

#### Design Directives:
- **`appointments/page.tsx`**:
  - Clean appointment card hierarchy: Date & time badge, doctor/service name, clinic address, and action buttons (`مشاهده جزئیات`, `لغو نوبت`).
  - Keep status badges meaningful: `«رزرو شده»`, `«انجام شده»`, `«لغو شده»`.
- **`notifications/page.tsx`**:
  - Remove pulsing decorative dots; use clean unread indicators (subtle background tint) and timestamps.
- **`admin-shell.tsx`**:
  - Clean navigation items without unnecessary micro-tags.
  - Ensure management tables for Doctors, Services, Foods, Content, and Tickets have clean, human-readable column headers.

---

### 2.8 Translation Catalogs (`messages/fa.json`, `en.json`, `ar.json`)

#### Design Directives:
- Audit and update all translation keys corresponding to removed or refined copy.
- Ensure `fa.json` remains the source of truth, with harmonious parity in `en.json` and `ar.json`.
- Strip legacy unused translation keys from past iterations.

---

## 3. Verification & Quality Assurance Strategy

The decluttering work must maintain 100% technical integrity and zero regressions:

1. **Type Safety**: `bunx tsc --noEmit` must pass with 0 errors.
2. **Lint Cleanliness**: `bun run lint` (oxlint) must pass with 0 errors.
3. **Unit & Integration Tests**: `bun run test` (vitest) must pass all unit tests without breakage.
4. **Next.js Production Build**: `bun run build` must compile all 108 App Router routes cleanly.
5. **Visual & Behavioral Checks**:
   - Verify that search functionality works smoothly without the non-functional mic icon.
   - Verify that empty state displays correctly on `/nutrition` when no meals are logged.
   - Verify that service detail pages render clean preparation guidance without the fake laboratory table.
   - Verify slot selection and reservation confirmation flow from end to end.
