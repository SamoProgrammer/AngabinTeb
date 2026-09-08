# Angabin Teb — Complete Functional Specification & System Architecture Blueprint
**Target Modernization Platform:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Drizzle ORM, better-auth, next-intl.  
**Source Baseline:** `angabinteb.com` (Exhaustive Reverse-Engineered Functional Audit).  
**Author:** AI Lead Systems Architect & Reverse-Engineering Agent.  
**Audited Account Credentials:** Username: `09015267167` | Verified Patient: `محمد محمدی` (کد ملی: `۰۹۲۸۱۳۴۶۳۶`).

---

## 1. Executive Summary & Purpose

This document provides the exhaustive functional specification, route hierarchy, data schema inputs, user interaction workflows, state transitions, and expected system outputs for the complete Angabin Teb digital ecosystem.

It maps **100% of public discovery surfaces, clinical reservation flows, nutrition analysis and diet subscription engines, educational knowledge hubs, authenticated patient dashboards, multi-stage clinical registry wizards, and corporate/compliance portals**.

Visual and decorative styling rules (colors, fonts, micro-animations) are omitted in favor of strict **functional specifications, state machines, API payloads, form input definitions, button triggers, and domain workflows** to guide exact technical replication.

---

## 2. Global System Conventions & Shared Mechanisms

### 2.1 Route & Localization Strategy
- **Localization Prefixes:** `/fa/` (Default, Persian RTL), `/en/` (English LTR), `/ar/` (Arabic RTL).
- **Bare URL Resolution:** Accessing root `/` redirects to the negotiated locale (e.g. `/fa/`). Accessing bare paths without locale prefixes (e.g., `/booking/doctors`) issues a 307 temporary redirect preserving all search queries to `/${locale}/booking/doctors`.
- **Locale Switcher Behavior:** Replaces the leading path segment (`/${locale}/*` $\to$ `/${targetLocale}/*`) and triggers a clean document reload to swap text direction (`dir="rtl"` $\leftrightarrow$ `dir="ltr"`).

### 2.2 Global Chrome (Header, Navigation & Footer)
- **Header Structure:**
  - **Brand Mark:** Navigates to `/${locale}/`.
  - **Mega-Dropdown 1: نوبت دهی (Appointment Booking):**
    - پزشکان و متخصصین (`/fa/booking/categories`)
    - خدمات تشخیصی (`/fa/booking/diagnostic-services`)
    - خدمات درمانی (`/fa/booking/therapy-services`)
    - خدمات بالینی در منزل (`/fa/booking/home-categories`)
    - خدمات توانبخشی (`/fa/booking/rehabilitation-categories`)
    - آمبولانس خصوصی (`/fa/booking/ambulance-categories`)
    - کلینیک‌ها و مراکز درمانی (`/fa/booking/offices-categories`)
    - مشاوره‌ها و پکیج‌های تخصصی (`/fa/booking/consultants`)
    - کارگاه‌های آموزشی (`/fa/booking/workshops`)
  - **Mega-Dropdown 2: دریافت رژیم (Diet Programs):**
    - پکیج‌های رژیم آنلاین و آفلاین (`/fa/booking/offline-diet/types`)
    - تحلیل آنلاین مواد غذایی و کالری شماری (`/fa/food-analysis/personal`)
    - جدول ارزش غذایی خوراکی‌ها (`/fa/foods`)
  - **Mega-Dropdown 3: مطالب آموزشی (Health Magazine):**
    - مقالات علمی و بالینی (`/fa/articles`)
    - پمفلت‌های آموزش بیمار (`/fa/knowledge/pamphlet`)
    - پایگاه ویدیوها و وبینارها (`/fa/knowledge/videos`)
    - پرسش‌های متداول پزشکی (`/fa/knowledge/faq`)
  - **Mega-Dropdown 4: ارتباط با ما (Contact & Organization):**
    - درباره ما (`/fa/about-us`)
    - تماس با ما (`/fa/contact-us`)
    - همکاری با ما (`/fa/work-with-us`)
    - راهنمای سایت (`/fa/notes/site-help`)
    - ثبت شکایات (`/fa/complains`)
    - قوانین و مقررات (`/fa/terms-and-conditions`)
  - **Authentication Action Button:**
    - *Guest State:* Renders "ورود / عضویت" linking to `/login`.
    - *Authenticated State:* Displays user display name (`محمد محمدی`), wallet balance badge (`۰ تومان`), and dropdown menu:
      - نوبت‌های من (`/fa/profile/reservations`)
      - اطلاعات کاربری (`/fa/profile/personal-info`)
      - کیف پول و تراکنش‌ها (`/fa/profile/balance`)
      - پیام‌ها و توصیه‌های پزشک (`/fa/profile/messages`)
      - خروج از حساب (POST `/logout`)
- **Global Footer Structure:**
  - **Emergency Banner:** Notice highlighting 115 Emergency Medical Services for acute situations.
  - **Accreditation & Trust Elements:** Health Ministry license badge, Enamad electronic commerce seal, Samandehi certificate, Incubator center affiliation (Mashhad University of Medical Sciences).
  - **Quick Links & Contact:** Postal address, emergency helpline, direct phone lines, institutional email.

---

## 3. Section-by-Section Functional Specification

### 3.1 Public Discovery & Landing Page (`/fa/`)

#### Purpose
Primary entry hub orienting the user, providing universal discovery of clinicians, diagnostic centers, educational content, and healthy nutrition plans.

#### Functional Blocks & Interactive Elements
1. **Universal Search Widget:**
   - **Inputs:** Text field for physician name, medical specialty, diagnostic service, or disease symptom.
   - **Buttons:** "جستجو" (Search).
   - **Flow & Result:** Submits GET query to `/fa/booking/doctors?q={term}` or dynamic autocomplete dropdown highlighting matched doctors and services.
2. **Clinical Hub Quick Actions (4 Core Portals):**
   - Card 1: نوبت دهی پزشکان $\to$ `/fa/booking/categories`
   - Card 2: خدمات تشخیصی $\to$ `/fa/booking/diagnostic-services`
   - Card 3: خدمات درمانی $\to$ `/fa/booking/therapy-services`
   - Card 4: خدمات در منزل $\to$ `/fa/booking/home-categories`
3. **Interactive Healthy Meals Slider (وعده‌های غذایی سالم):**
   - **Controls:** 3 interactive category tabs:
     - `صبحانه` (Breakfast)
     - `ناهار و شام` (Lunch & Dinner)
     - `میان وعده` (Snacks)
   - **Behavior:** Clicking a tab swaps the visible card carousel without full page reload.
   - **Card Elements:** Dish photo, Persian title, calorie count, preparation time.
   - **Action:** Clicking any card routes to `/fa/foods/{slug}`. "مشاهده همه" button routes to `/fa/foods/meal-type/{selected-type}`.
4. **Physician Spotlight Carousel:**
   - Displays featured physicians with specialty, clinic location, and direct "رزرو نوبت" button navigating to `/fa/booking/doctor/{slug}/reserve`.
5. **Latest Clinical Articles Carousel:**
   - Displays recent peer-reviewed articles with category tag, reading time, and direct link to `/fa/article/{slug}`.

---

### 3.2 Clinician Directory & Appointment Booking Subsystem

#### A. Medical Specialties Catalog (`/fa/booking/categories`)
- **Purpose:** High-level medical taxonomy directory.
- **Functionality:** Presents grid of 13 official medical specialties:
  1. تغذیه و رژیم درمانی (Nutrition & Dietetics)
  2. گوارش و کبد (Gastroenterology & Hepatology)
  3. زنان و زایمان (Obstetrics & Gynecology)
  4. قلب و عروق (Cardiology)
  5. کودکان و نوزادان (Pediatrics)
  6. ژنتیک پزشکی (Medical Genetics)
  7. غدد و متابولیسم (Endocrinology)
  8. مغز و اعصاب (Neurology)
  9. ارتوپدی (Orthopedics)
  10. کلیه و مجاری ادراری (Nephrology & Urology)
  11. پوست، مو و زیبایی (Dermatology)
  12. جراحی دهان، فک و صورت (Maxillofacial Surgery)
  13. بیماری‌ها و جراحی پستان (Breast Surgery)
- **User Action:** Clicking any specialty routes to `/fa/booking/doctors?filter_speciality[]={id}`.

#### B. Doctor Directory & Search (`/fa/booking/doctors`)
- **Purpose:** Filterable, paginated registry of all active medical practitioners.
- **Inputs & Filters (Filter Drawer / Sidebar):**
  - Search input: Physician name query.
  - Specialty checkboxes: Multi-select array `filter_speciality[]`.
  - City checkboxes: Geographic filter `filter_city[]` (e.g. City ID 37 for Mashhad).
  - Sort order dropdown: Most popular, earliest available slot, highest rated.
- **Buttons:**
  - "اعمال فیلتر" (Apply Filter): Executes GET request with active query params.
  - "حذف فیلترها" (Reset Filters): Clears all selected checkboxes and reloads baseline listing.
- **Results per Card:**
  - Doctor avatar, full name, specialty/subspecialty, Medical Council Code (کد نظام پزشکی), clinic address snippet, next available appointment date.
  - Button "مشاهده پروفایل": Routes to `/fa/booking/doctor/{slug}`.
  - Button "رزرو نوبت": Routes directly to slot calendar `/fa/booking/doctor/{slug}/reserve`.

#### C. Doctor Profile Page (`/fa/booking/doctor/{slug}`)
- **Purpose:** Credential verification, clinic location details, and direct booking trigger.
- **Displayed Data:**
  - Doctor academic rank, medical council registration, biography, clinical interests.
  - Clinic contact details: Landline telephone (`۰۵۱-۳۸۶۵۵۶۹۵`), exact street address, Leaflet/Google Map pin coordinates.
  - Downloadable scientific CV / resume (PDF).
- **Interactive Triggers:**
  - "رزرو نوبت آنلاین" (Book Online Appointment): Directs user to `/fa/booking/doctor/{slug}/reserve`.

#### D. Slot Booking Calendar (`/fa/booking/doctor/{slug}/reserve`)
- **Purpose:** Interactive calendar for selecting specific clinical appointment slots.
- **Authentication Guard:**
  - *If Unauthenticated:* Halts flow and presents a modal or redirects to `/login` with `returnUrl`.
  - *If Authenticated:* Renders the slot reservation interface.
- **Flow & Controls:**
  1. **Platform Deposit Notice:** Informs patient of the refundable platform reservation fee (2,000 Tomans / 3,000 Tomans per policy).
  2. **Persian Month Slider:** Forward/back navigation across Jalali calendar months (e.g., شهریور، مهر، آبان...).
  3. **Weekly Schedule Matrix:** Displays days of the week (شنبه تا جمعه) with dates.
  4. **Slot Cells:**
     - `.reservable` (Available): Displays exact appointment time (e.g., `۱۷:۱۵`), clickable.
     - `.non-reservable` (Full/Unavailable): Disabled, styled inactive.
  5. **Slot Selection Action:**
     - User clicks an active slot cell.
     - Confirmation modal opens showing: Doctor Name, Specialty, Date & Time, Platform Deposit Fee, Cancellation Terms.
     - Payment Options:
       - Pay via Wallet Balance (if wallet $\ge$ fee).
       - Pay via Online Payment Gateway (Shaparak / Mellat / Zarinpal).
     - Result: Slot lock occurs. Upon successful payment/deduction, system issues unique Reservation Code, sends SMS notification, and redirects to `/fa/profile/reservations`.

---

### 3.3 Diagnostic, Therapeutic & Auxiliary Healthcare Portals

#### A. Diagnostic Services Hub (`/fa/booking/diagnostic-services`)
- **Purpose:** Booking specialized outpatient diagnostic examinations and laboratory screenings.
- **Service Categories:**
  1. قلب و عروق (Cardiovascular Diagnostics): Resting ECG, Exercise stress test, 24-hour ambulatory blood pressure Holter, 24-48h Holter ECG, Echocardiography, Coronary CT angiography, Vascular age assessment.
  2. قلب و عروق از راه دور (Remote Cardiology): Tele-monitoring, home ECG transmission.
  3. تغذیه و متابولیسم (Nutrition Diagnostics): Indirect calorimetry, body impedance analysis, resting metabolic rate test.
  4. گوارش و کبد (GI & Liver): Endoscopy, colonoscopy, FibroScan, breath hydrogen test.
  5. آزمایشگاه تشخیص پزشکی (Laboratory): Complete blood count, lipid profile, metabolic panel, hormonal assays.
  6. پزشکی هسته‌ای (Nuclear Medicine): Myocardial perfusion imaging (MPI/SPECT), bone scintigraphy, thyroid scans.
- **Workflow:** User filters by diagnostic category and city $\to$ Selects service $\to$ Views accredited diagnostic centers performing the test $\to$ Selects clinic and time slot $\to$ Completes booking.

#### B. Therapeutic Services Hub (`/fa/booking/therapy-services`)
- **Purpose:** Specialized clinical and non-invasive therapeutic interventions.
- **Service Categories:**
  - لاغری و تناسب اندام موضعی (Non-invasive body contouring, cryolipolysis, cavitation, RF).
  - گوارش و کبد (Endoscopic interventions, biofeedback for pelvic floor disorders).
  - پوست و مو (Dermatological lasers, hair restoration, scar therapies).
  - جراحی عمومی (Outpatient minor surgical procedures).
  - فیزیولوژی ورزشی (Prescribed clinical exercise rehab).
  - روانشناسی و مشاوره رفتاری (Cognitive behavioral therapy, eating disorder therapy).

#### C. Auxiliary Agency Services (Rehab, Home Care, Ambulance, Clinics)
- **Rehabilitation Hub (`/fa/booking/rehabilitation-categories`):**
  - Subspecialties: Physiotherapy (فیزیوتراپی), Occupational therapy (کاردرمانی), Speech therapy (گفتاردرمانی), Audiology (شنوایی‌شناسی), Optometry (بینایی‌سنجی).
  - Functionality: Filters clinician network by rehabilitation provider type.
- **Home Care Clinical Hub (`/fa/booking/home-categories`):**
  - Subspecialties: Home nursing visits (تزریقات و پانسمان), In-home physician visits (ویزیت پزشک در منزل), Elderly medical companion care (مراقبت سالمند), In-home blood sampling & lab collection (نمونه‌گیری آزمایشگاه در منزل).
  - Functionality: Requests dispatched clinician or books scheduled home visit.
- **Ambulance Dispatch Hub (`/fa/booking/ambulance-categories`):**
  - Services: Standard patient transfer ambulance (آمبولانس معمولی), Intensive care ground transport (آمبولانس کددار ICU/CCU), Intercity medical repatriation (انتقال بین‌شهری).
  - Functionality: Provides direct dispatch telephone triggers and booking request forms.
- **Clinics & Medical Complexes (`/fa/booking/offices-categories`):**
  - Directory of polyclinics, specialized day-clinics, and imaging centers.

#### D. Consultants & Specialty Clinical Packages (`/fa/booking/consultants`)
- **Specialized Consultation Offerings:**
  1. مشاوره تلفنی و تنظیم رژیم (Phone consultation with clinical nutritionist).
  2. ویزیت و معاینه در منزل (Home clinical visit).
  3. مشاوره آنلاین و رژیم درمانی (Video tele-consultation).
  4. ویزیت گروهی و کارگاه تعاملی (Group patient counseling).
  5. مشاوره تغذیه و ژنتیک (Nutrigenomics package).
  6. تعیین جنسیت قبل از بارداری (Pre-pregnancy dietary sex-selection protocol).
  7. بررسی کمبود املاح و ویتامین‌ها (Micronutrient deficiency diagnostic review).
  8. سنجش چربی احشایی و متابولیک (Visceral fat evaluation).
- **Booking Flow:** Select package $\to$ Choose assigned consultant $\to$ Select appointment window $\to$ Checkout.

#### E. Academic & Clinical Workshops (`/fa/booking/workshops`)
- **Offerings:** Medical and health research methodology courses:
  - جستجوی پیشرفته در پایگاه‌های اطلاعات علمی (PubMed, Scopus, Web of Science).
  - پروپوزال‌نویسی و اصول مقاله‌نویسی پزشکی (Medical research proposal writing).
  - تجزیه و تحلیل داده‌های زیستی با نرم‌افزار SPSS (Biostatistics with SPSS).
  - تکنیک‌های کنترل کیفی و آزمایشگاهی (Clinical laboratory QA techniques).
- **Course Attributes:** Instructor credentials, scheduled dates, total contact hours, seat capacity limit, registration fee.
- **Booking Action:** "ثبت نام در کارگاه" $\to$ Form input (National code, academic affiliation) $\to$ Gateway payment $\to$ Issuance of workshop registration pass.

---

### 3.4 Nutrition Intelligence, Food Database & Calorie Engine

#### A. Iranian & Global Food Database (`/fa/foods`, `/fa/foods/meal-type/{type}`)
- **Purpose:** Searchable biochemical nutritional reference database for thousands of ingredients and traditional Persian meals.
- **Filtering Options:** Meal type filter (`صبحانه`, `ناهار و شام`, `میان وعده`), keyword search.
- **Food Profile Detail Page (`/fa/foods/{slug}`):**
  - **Tab 1 — درشت‌مغذی‌ها (Macronutrients):**
    - Energy (Calories per 100g or standard portion).
    - Carbohydrates (g), Total Protein (g), Total Fat (g).
    - Saturated fat, monounsaturated fat, polyunsaturated fat, trans fat.
    - Glycemic index (GI) & Glycemic load (GL).
  - **Tab 2 — ریزمغذی‌ها و املاح (40+ Clinical Micronutrients):**
    - Moisture/Water (g), Total Nitrogen (g), Starch (g).
    - Sugars breakdown: Total Sugars, Glucose, Fructose, Sucrose, Maltose, Lactose.
    - Fiber breakdown: Non-starch fiber, Soluble dietary fiber, Insoluble dietary fiber.
    - Lipids: Cholesterol (mg).
    - Minerals: Sodium (Na), Potassium (K), Calcium (Ca), Magnesium (Mg), Phosphorus (P), Iron (Fe), Copper (Cu), Zinc (Zn), Chlorine (Cl), Manganese (Mn), Selenium (Se), Iodine (I).
    - Vitamins: Retinol (Vit A), Carotene, Cholecalciferol (Vit D), Alpha-Tocopherol (Vit E), Thiamine (B1), Riboflavin (B2), Niacin (B3), Pantothenic acid (B5), Pyridoxine (B6), Biotin (B7), Folic acid (B9), Cobalamin (B12), Ascorbic acid (Vit C).
    - Amino acids: Tryptophan (mg).
  - **Tab 3 — خواص و دستور پخت (Nutritional Value, Health Benefits & Recipe):**
    - Indications, disease interactions (e.g. renal diet caution, diabetic safety).
    - Traditional Iranian healthy preparation and cooking guidelines.

#### B. Interactive Food Analysis & Calorie Tracking (`/fa/food-analysis/*`)
- **Step 1 — Baseline Biometrics (`/fa/food-analysis/personal`):**
  - **Form Inputs:**
    - جنسیت (Gender): Male / Female.
    - وضعیت فیزیولوژیک (Physiological State): Non-pregnant, Pregnancy Trimester 1 / 2 / 3, Lactation (0-6 months / 6-12 months).
    - سال تولد (Birth Year): Jalali year picker (e.g. 1370).
    - وزن (Weight): In kilograms (decimal supported).
    - قد (Height): In centimeters.
    - سطح فعالیت بدنی (Physical Activity Level): 5 tiers:
      1. بدون فعالیت / پشت میز نشین (Sedentary, PAL 1.2)
      2. فعالیت سبک (Lightly active, PAL 1.375)
      3. فعالیت متوسط (Moderately active, PAL 1.55)
      4. فعالیت سنگین (Very active, PAL 1.725)
      5. فعالیت بسیار سنگین / ورزشکار حرفه‌ای (Extra active, PAL 1.9)
  - **Next Step Button:** "مرحله بعد: ثبت خوراکی‌ها" $\to$ Navigates to Step 2.
- **Step 2 — Dietary Intake Log & Portion Units (`/fa/food-analysis/terms`):**
  - **Food Item Search & Selection:** Autocomplete field querying food database.
  - **Traditional Persian Portion Units:**
    - کف دست بدون انگشت (Palm size, without fingers — for breads/meats).
    - لیوان فرانسوی دسته‌دار (Standard glass/cup — for liquids/grains).
    - قاشق غذاخوری (Tablespoon — for oils, stews, rice).
    - کفگیر (Rice server spatula).
    - بشقاب پلوخوری / خورش‌خوری (Standard dining plate / stew bowl).
    - عدد / برش / گرم (Single piece / slice / exact grams).
  - **Computation Engine Output (Mifflin-St Jeor + Iranian Nutrient Tables):**
    - BMR (Basal Metabolic Rate in kcal).
    - TDEE (Total Daily Energy Expenditure in kcal).
    - Total Calorie Intake vs Target Expenditure (Surplus / Deficit calculation).
    - Macronutrient split: % Carbohydrates, % Protein, % Fat.
    - Micronutrient sufficiency gauges vs RDA (Recommended Dietary Allowances).

---

### 3.5 Educational Magazine, Multimedia & Patient Knowledge Hub

#### A. Nutrition Knowledge Category Index (`/fa/nutrition-knowledge`)
- **Purpose:** Centralized medical content hub organized by pathology and health state.
- **14 Specialized Clinical Domains:**
  1. چاقی و اضافه وزن (Obesity & Weight Management)
  2. رژیم درمانی بیماری‌ها (Clinical Medical Nutrition Therapy)
  3. بهداشت و ایمنی مواد غذایی (Food Hygiene & Safety)
  4. تغذیه در کرونا و بیماری‌های عفونی (Infectious Disease Nutrition)
  5. تغذیه نوزادان، کودکان و نوجوانان (Pediatric Nutrition)
  6. ویتامین‌ها و مواد معدنی (Micronutrients & Supplements)
  7. تغذیه در ورزش و بدنسازی (Sports Nutrition)
  8. تغذیه سالمندان (Geriatric Nutrition)
  9. بارداری و شیردهی (Maternal & Lactation Nutrition)
  10. تغذیه در دیابت (Diabetic Diet Therapy)
  11. تغذیه در بیماری‌های قلبی و عروقی (Cardiovascular Nutrition)
  12. تغذیه در بیماری‌های کلیوی (Renal Nutrition)
  13. تغذیه در اختلالات گوارش و کبد (GI & Hepatic Nutrition)
  14. تغذیه در سرطان (Oncology Nutrition)
- **Controls:** Live search bar filtering articles by medical keywords.

#### B. Articles Directory & Reader (`/fa/articles`, `/fa/article/{slug}`)
- **Directory (`/fa/articles`):**
  - Search bar, category filter tags, paginated card feed.
  - Tag links (`/fa/tag/{slug}`): Groups articles sharing common thematic tags.
- **Article Reader (`/fa/article/{slug}`):**
  - Metadata: Title, verified medical author, publish date, reading time estimate.
  - Body: Structured rich text with clinical citations, medical diagrams, infographics.
  - Downloadable Pamphlet: Direct download link for scientific publication PDF (`/contents/posts/{id}/*.pdf`).
  - Social Sharing: WhatsApp, Telegram, Email, LinkedIn sharing hooks.
  - Related Articles Carousel.

#### C. Patient Clinical Pamphlets (`/fa/knowledge/pamphlet`)
- **Purpose:** Repository of printable, authoritative clinical patient education pamphlets.
- **Display:** Grid of downloadable PDF brochures for post-op care, diabetic living, low-sodium diets, etc., with direct download buttons.

#### D. Clinical FAQ Library (`/fa/knowledge/faq`)
- **Purpose:** 37 clinically vetted Q&As answering frequent medical and nutritional inquiries.
- **Display:** Interactive accordion list. Clicking a question expands the clinical explanation and references.

#### E. Video & Webinar Hub (`/fa/knowledge/videos`)
- **Purpose:** Educational multimedia center for patient self-care and webinars.
- **Player Integration:** Responsive iframe embedding Aparat video player (`aparat.com/v/...`), with video summary notes and timestamps.

---

### 3.6 Authenticated Patient Portal (`/fa/profile/*`)

#### User Authentication State
- **Audited Account:** `09015267167`
- **Patient Identity:** `محمد محمدی` | National ID: `0928134636` | Email: `samo092813463@gmail.com`.

#### A. Appointment Management (`/fa/profile/reservations`)
- **Two Interactive Tabs:**
  1. نوبت‌های فعال (Active Appointments):
     - Table columns: پزشک / مرکز (Doctor/Center), خدمت (Service), تاریخ و ساعت (Date/Time), کد پیگیری (Tracking code), وضعیت (Status: تایید شده / در انتظار), عملیات (Action).
     - Action Button "لغو نوبت" (Cancel Reservation):
       - Trigger opens cancellation modal detailing refund policy: If canceled $>24$ hours prior, 100% of reservation deposit refunded to wallet. If $<24$ hours, cancellation fee deducted per terms.
       - Confirming cancellation executes cancellation mutation and refreshes list.
  2. نوبت‌های منقضی شده / گذشته (Past & Expired Appointments):
     - Archive of historical appointments, medical follow-ups, and completed visits.

#### B. Personal Account Information (`/fa/profile/personal-info`)
- **Form Fields:**
  - نام و نام خانوادگی (Full Name): Text field (`محمد محمدی`).
  - نام پدر (Father's Name): Text field.
  - کد ملی (National Code): Read-only / disabled field (`۰۹۲۸۱۳۴۶۳۶`).
  - شماره تلفن همراه (Mobile Number): Read-only / verified (`۰۹۰۱۵۲۶۷۱۶۷`).
  - آدرس ایمیل (Email Address): Email input (`samo092813463@gmail.com`).
  - جنسیت (Gender): Radio toggle (مرد / زن).
  - کلمه عبور جدید (New Password): Password input (optional, for credential updates).
  - تکرار کلمه عبور جدید (Confirm Password): Password input.
- **Submit Button:** "ذخیره تغییرات" (Save Changes) $\to$ Updates identity record and renders success toast.

#### C. Financial Wallet & Ledger (`/fa/profile/balance`)
- **Display Components:**
  - موجودی کیف پول (Current Wallet Balance): Displayed in Tomans (`۰ تومان`).
  - "افزایش اعتبار" (Top-up Balance) Action:
    - Input: Amount in Tomans (quick select buttons: ۵۰,۰۰۰, ۱۰۰,۰۰۰, ۲۰۰,۰۰۰, or custom amount).
    - Button: "انتقال به درگاه پرداخت" $\to$ Routes to Shaparak online gateway $\to$ Credits wallet upon verification.
  - جدول گردش حساب (Transaction History Ledger):
    - Columns: شناسه تراکنش (ID), عنوان تراکنش (Title/Reason), مبلغ (Amount in Tomans, colored green for credit / red for debit), تاریخ و زمان (Timestamp), کد رهگیری بانکی (Bank Ref Code), وضعیت (Status: موفق / ناموفق).

#### D. Clinician Messages & Prescriptions (`/fa/profile/messages`)
- **Display Components:**
  - Secure communication channel receiving official medical instructions, personalized diet notices, and lab test requests from attending physicians.
  - Columns: فرستنده (Sender Doctor), موضوع پیام (Subject), تاریخ ارسال (Date), وضعیت (خوانده شده / جدید), عملیات (مشاهده).
  - Action "مشاهده پیام": Expands clinical recommendation text and provides download links for attached clinical files.

---

### 3.7 The 8-Stage Clinical Registry Wizard (`/registry/form/{id}/*`)

#### Purpose
A mandatory, comprehensive electronic clinical evaluation form that patients must complete before receiving specialized, medically supervised diet programs.

#### Detailed Stage Breakdown:

1. **مرحله ۱: اطلاعات فردی و دموگرافیک (`person-information`):**
   - وضعیت تاهل (Marital Status): مجرد (Single) / متأهل (Married) / سایر.
   - شغل (Occupation): Text field.
   - جنسیت (Gender): مرد / زن.
   - تاریخ تولد (Birth Date): روز / ماه / سال (Jalali picker).
   - سطح تحصیلات (Education Level): ۸ گزینه (بی‌سواد، ابتدایی، سیکل، دیپلم، فوق دیپلم، کارشناسی، کارشناسی ارشد، دکتری).
   - تعداد فرزندان (Children Count): Numeric counter.
   - وضعیت فعالیت بدنی روزانه و هفتگی (Physical Activity): ساعت در هفته.
   - شدت فعالیت بدنی (Activity Intensity): بدون تحرک / سبک / متوسط / شدید.
   - علت اصلی مراجعه و دریافت رژیم (Referral Purpose): ۸ گزینه (کاهش وزن، افزایش وزن، کبد چرب، دیابت، بارداری/شیردهی، ورزش، بیماری قلبی، سایر).
   - شماره واتساپ / ایتا (Messaging App Mobile): Phone number for follow-up support.
   - تلفن ثابت (Landline Phone).
   - استان و شهر (Province & City): Dependent cascading dropdowns.
   - آدرس دقیق پستی (Detailed Postal Address).
   - Button: "ثبت و مرحله بعد" (Save & Proceed to Stage 2).

2. **مرحله ۲: سوابق بیماری و پزشکی (`medical-history`):**
   - سابقه بیماری در بستگان درجه اول (Family History in 1st Degree Relatives): Checkboxes for Diabetes, Hypertension, CVD, Cancer, Obesity, Thyroid disorders.
   - سابقه بیماری‌های فردی (Personal Pathologies): Comprehensive checklist.
   - چک‌لیست شرایط بحرانی (Critical Clinical Checklist — Yes/No toggles):
     - داشتن ضربان‌ساز قلب (Pacemaker / ICD implant).
     - جراحی‌های چاقی و باریاتریک گذشته (Gastric bypass, sleeve, balloon).
     - سابقه تشنج یا صرع (Epilepsy / Seizures).
     - اختلالات انعقاد خون و مصرف وارفارین (Coagulation disorders / Anticoagulants).
     - سابقه استفاده از دستگاه‌های لاغری موضعی.
   - اثرات رژیم‌های گذشته بر سلامت فرد.
   - Button: "ثبت و مرحله بعد".

3. **مرحله ۳: سوابق دارویی و مکمل‌ها (`drug-history`):**
   - داروها و مکمل‌های مصرفی فعلی (Current Active Medications):
     - Repeater input: نام دارو (Drug Name), دوز مصرفی (Dosage), مدت زمان مصرف (Duration).
   - Button: "ثبت و مرحله بعد".

4. **مرحله ۴: عادات فردی و دخانیات (`addiction-history`):**
   - مصرف دخانیات و قلیان (Cigarette / Hookah): بلی / خیر (تعداد نخ در روز / دفعات در هفته).
   - مصرف الکل (Alcohol consumption): بلی / خیر (دفعات و میزان).
   - کیفیت و ساعات خواب شبانه‌روزی (Sleep duration & quality).
   - Button: "ثبت و مرحله بعد".

5. **مرحله ۵: ارزیابی عادات غذایی و تغذیه‌ای (`nutrition-information`):**
   - تعداد وعده‌ها و میان‌وعده‌های روزانه (Daily meal frequency).
   - حساسیت‌ها و آلرژی‌های غذایی (Food Allergies & Intolerances, e.g. Celiac, Lactose).
   - غذاهای مورد علاقه و غذاهای نامطلوب / بیزاری غذایی (Food Preferences & Aversions).
   - مصرف روزانه مایعات و آب (Daily water intake in glasses).
   - سابقه ریزه‌خواری شبانه یا پرخوری عصبی (Night eating syndrome / Emotional eating).
   - Button: "ثبت و مرحله بعد".

6. **مرحله ۶: غربالگری قلبی و عروقی (`cardiovascular-questions`):**
   - علائم هشدار بالینی (Symptom checklist):
     - درد یا فشار در قفسه سینه هنگام فعالیت یا استراحت (Chest pain / Angina).
     - تپش قلب ناگهانی و تنگی نفس (Palpitations / Dyspnea).
     - سرگیجه، تاری دید یا سابقه افت فشار خون (Syncope / Dizziness).
     - ورم مچ پا و اندام‌های تحتانی (Peripheral edema).
   - سابقه فشار خون بالا و آخرین عدد اندازه‌گیری شده.
   - Button: "ثبت و مرحله بعد".

7. **مرحله ۷: اندازه‌گیری‌های تن‌سنجی (`anthropometric`):**
   - دور کمر (Waist Circumference in cm).
   - دور باسن (Hip Circumference in cm).
   - دور مچ دست (Wrist Circumference in cm — for body frame determination).
   - دور گردن (Neck Circumference in cm).
   - درصد چربی تخمینی یا ثبت شده با دستگاه بادی کامپوزیشن (Body Fat %).
   - بالاترین و پایین‌ترین وزن در ۲ سال اخیر (Weight fluctuation history).
   - Button: "ثبت و مرحله بعد".

8. **مرحله ۸: پیوست مدارک پزشکی و آزمایش‌ها (`medical-documents`):**
   - بارگذاری تصاویر آخرین برگه آزمایش خون (Upload recent blood lab tests, PDF/JPG/PNG).
   - بارگذاری سونوگرافی، نوار قلب یا مدارک تشخیصی (Upload ultrasound / ECG / medical reports).
   - توضیحات تکمیلی بیمار برای متخصص تغذیه (Patient remarks / special instructions).
   - Button: "ثبت نهایی پرونده بالینی" (Final Submission) $\to$ Locks registry, notifies clinical team, advances to diet generation.

---

### 3.8 Offline Diet Subscription Application (`/fa/booking/offline-diet/*`)

#### Architecture & Layout
A mobile-first web app view designed with an app shell containing a persistent bottom navigation dock:
1. `بدن من` (My Body): Links to `/fa/booking/offline-diet/my-body`.
2. `رژیم` (Diets): Links to `/fa/booking/offline-diet/dietss`.
3. `صفحه اصلی` (Home): Links to `/fa/booking/offline-diet/dashboard`.
4. `کالری شمار` (Calorie Tracker): Links to `/fa/booking/offline-diet/food-analysis`.
5. `پشتیبانی` (Live Support): Triggers Goftino live chat widget.

#### A. My Body Section (`my-body`)
- **Sub-pages & Features:**
  - پیوند به فرم پرونده بالینی (Link to Registry Form).
  - نمودار تغییرات وزن (`wight-change-chart`): Line graph visualizing weigh-ins over time against target weight.
  - محاسبه‌گر BMI و شاخص توده بدنی (`bmi`):
    - Inputs: قد (Height cm), وزن (Weight kg).
    - Result: Numeric BMI with 7 clinical classification bands:
      1. کم‌وزنی شدید ($< 16.5$)
      2. کم‌وزنی ($16.5 - 18.4$)
      3. وزن طبیعی و سلامت ($18.5 - 24.9$)
      4. اضافه‌وزن ($25 - 29.9$)
      5. چاقی درجه ۱ ($30 - 34.9$)
      6. چاقی درجه ۲ ($35 - 39.9$)
      7. چاقی درجه ۳ / خطرناک ($\ge 40$)

#### B. Diets Section (`dietss`)
- **Sub-pages:**
  - لیست رژیم‌های من (`listt-diets`): Archive of current and past prescribed diet plans, meal plan downloads, nutritionist comments.
  - دریافت رژیم جدید (`diets/get-new-diet`): Triggers the 6-stage diet acquisition funnel.

#### C. The 6-Stage Diet Acquisition Funnel
1. **Stage 1: انتخاب دسته‌بندی رژیم (`types`):**
   - 18 Specialized Clinical Categories:
     1. مدیریت وزن و لاغری (Weight Management)
     2. ورزشکاران و تناسب اندام (Athletes & Fitness)
     3. تعیین جنسیت جنین (Pre-conception Sex Selection)
     4. دوران بارداری (Pregnancy)
     5. دوران شیردهی (Lactation)
     6. کودکان (Children)
     7. نوجوانان و بلوغ (Adolescents)
     8. سالمندان (Elderly)
     9. دیابت (نوع ۱، نوع ۲، بارداری)
     10. بیماری‌های قلبی و عروقی (Cardiovascular)
     11. بیماری‌های کلیوی (Renal / Kidney Disease)
     12. کبد چرب و اختلالات کبدی (Fatty Liver & Hepatic)
     13. سرطان و مراقبت انکولوژی (Cancer Nutrition)
     14. سایر شرایط بالینی (Other Pathologies)
     15. رژیم دش (DASH Diet for Hypertension)
     16. رژیم مدیترانه‌ای (Mediterranean Diet)
     17. رژیم کتوژنیک بالینی (Clinical Ketogenic Diet)
     18. رژیم گیاه‌خواری / وگان (Vegetarian / Vegan Diet)
2. **Stage 2: انتخاب سطح پلن رژیم (`diets`):**
   - **پلن برنزی (Bronze Plan):**
     - Duration: ۱.۵ ماهه (45 days) | Cycles: ۳ دوره تغییر برنامه | شامل: پشتیبانی متنی، فایل راهنمای اختصاصی.
     - Price: ۱۷۰,۰۰۰ تومان (170,000 Tomans).
   - **پلن نقره‌ای (Silver Plan):**
     - Duration: ۳ ماهه (90 days) | Cycles: ۶ دوره تغییر برنامه | شامل: کلیه امکانات برنز + برنامه ورزشی مکمل خانگی.
     - Price: ۳۵۰,۰۰۰ تومان (350,000 Tomans).
   - **پلن طلایی (Gold Plan):**
     - Duration: ۶ ماهه (180 days) | Cycles: ۱۲ دوره تغییر برنامه | شامل: کلیه امکانات نقره + پشتیبانی ویژه صوتی.
     - Price: ۶۶۰,۰۰۰ تومان (660,000 Tomans).
   - **پلن ویژه VIP (VIP Plan):**
     - Duration: ۶ ماهه (180 days) | Cycles: ۱۲ دوره تغییر برنامه | شامل: کلیه امکانات طلایی + ویزیت تصویری آنلاین با متخصص ارشد + دوره تثبیت وزن رایگان.
     - Price: ۸۶۰,۰۰۰ تومان (860,000 Tomans).
3. **Stage 3: پرداخت آنلاین حق اشتراک (Online Payment):**
   - Connection to Shaparak payment gateway; validates transaction.
4. **Stage 4: تکمیل پرونده بالینی (Complete Medical Registry):**
   - Redirects to the 8-stage Clinical Registry Wizard if not completed.
5. **Stage 5: بررسی و تدوین برنامه توسط متخصص (Clinical Formulation):**
   - Nutritionist reviews lab results, anthropometry, and calorie requirements; drafts personalized meal plan.
6. **Stage 6: تحویل برنامه و آغاز دوره رژیم (Plan Delivery & Execution):**
   - Patient receives SMS and in-app notification with meal charts, alternative food exchange lists, and check-in calendar.

---

### 3.9 Institutional, Compliance & Support Systems

#### A. About Us (`/fa/about-us`)
- **Content:** Institutional background, founded in 2018 in the Technology Incubator Center of Mashhad University of Medical Sciences (مرکز رشد دانشگاه علوم پزشکی مشهد). Mission statement: Bridging clinical academic nutrition science with accessible digital health delivery.

#### B. Contact Us (`/fa/contact-us`)
- **Information:**
  - نشانی: مشهد، مرکز فناوری‌های سلامت دانشگاه علوم پزشکی مشهد.
  - تلفن تماس: `۰۵۱-۳۸۴۵۸۷۷۲-۳`.
  - ایمیل سازمانی: `info@angabinteb.com`.
- **Contact Form:**
  - Fields: نام کامل (Name), شماره تماس (Phone), موضوع پیام (Subject), متن پیام (Message).
  - Submit Button: "ارسال پیام" $\to$ Records feedback and returns success alert.

#### C. Work With Us / Partnerships (`/fa/work-with-us`)
- **Purpose:** B2B onboarding for medical centers and practitioners.
- **Form Fields:**
  - نام و نام خانوادگی / نام موسسه (Name or Institution Name).
  - شماره تماس و موبایل رابط (Contact Number).
  - زمینه همکاری (Cooperation Sector Dropdown):
    - پزشکان و متخصصین تغذیه (Physicians & Nutritionists)
    - آزمایشگاه‌ها و مراکز تصویربرداری (Laboratories & Imaging Centers)
    - بیمارستان‌ها و درمانگاه‌ها (Hospitals & Polyclinics)
    - داروخانه‌ها و دراگ‌استورها (Pharmacies)
    - فروشگاه‌های مواد غذایی سلامت‌محور (Health Food Stores)
    - باشگاه‌ها و مراکز ورزشی (Gyms & Fitness Clubs)
    - سایر زمینه‌ها (Other)
  - متن درخواست و رزومه (Proposal Text & Resume Attachment).
  - Submit Button: "ارسال درخواست همکاری".

#### D. End-User Guide & Knowledge Base (`/fa/notes/site-help`)
- **Comprehensive Step-by-Step Guides:**
  1. راهنمای نوبت‌گیری آنلاین از پزشکان و مراکز (Step-by-step doctor booking).
  2. راهنمای لغو یا جابجایی نوبت (Appointment rescheduling and cancellation rules).
  3. راهنمای ثبت‌نام و دریافت رژیم‌های آنلاین و آفلاین (Diet subscription guide).
  4. نحوه استفاده از کالری‌شمار و تحلیلگر هوشمند غذا (Calorie tracker instructions).
  5. نحوه شارژ کیف پول و پرداخت‌های اینترنتی (Wallet deposit walkthrough).
  6. راهنمای بارگذاری مدارک و آزمایش‌ها در پرونده پزشکی (Document upload guidelines).
  7. راهنمای ارتباط با پشتیبانی و ارسال تیکت (Support ticket instructions).

#### E. Terms, Conditions & Cancellation Policy (`/fa/terms-and-conditions`)
- **Key Legal Clauses:**
  - حق سرویس رزرواسیون: مبلغ ۳,۰۰۰ تومان به عنوان هزینه خدمات سایت در زمان ثبت اولیه نوبت منظور می‌گردد.
  - قوانین استرداد و لغو نوبت:
    - در صورت لغو نوبت بیش از ۲۴ ساعت قبل از موعد مقرر، ۱۰۰٪ وجه به کیف پول کاربر بازگردانده می‌شود.
    - در صورت لغو کمتر از ۲۴ ساعت قبل از زمان نوبت، مبلغ ۳,۰۰۰ تومان به عنوان جریمه کنسلی کسر و مابقی مسترد می‌گردد.
  - تعهدات حفظ محرمانگی داده‌های بالینی و ژنتیکی بیماران مطابق پروتکل‌های وزارت بهداشت.

#### F. Complaints & Grievance Registration (`/fa/complains`)
- **Form Fields:** نام و نام خانوادگی، شماره تماس، کد پیگیری نوبت یا خدمت (اختیاری)، نام پزشک یا بخش مورد شکایت، شرح شکایت، بارگذاری مستندات.
- **Action:** Submits complaint to administrative compliance board with tracking code issued.

---

## 4. Modernization Architecture & Mapping to Next.js 16 Codebase

The reverse-engineered legacy structure maps to our Next.js 16 App Router architecture as follows:

| Legacy Route / Concept | Target App Router File Path | Architectural Context | Key Components & Libraries |
| :--- | :--- | :--- | :--- |
| `/fa/` | `src/app/[locale]/(discovery)/page.tsx` | Catalog / Content | UniversalSearchBar, TrustMetrics, HealthyMealsSlider |
| `/fa/booking/categories` | `src/app/[locale]/(booking)/booking/categories/page.tsx` | Booking / Catalog | SpecialtyGrid, MedicalTaxonomy |
| `/fa/booking/doctors` | `src/app/[locale]/(booking)/booking/doctors/page.tsx` | Booking / Catalog | DoctorFilterDrawer, DoctorCard, queries.ts |
| `/fa/booking/doctor/{slug}` | `src/app/[locale]/(booking)/booking/doctor/[slug]/page.tsx` | Booking | DoctorProfileView, ClinicMap, Credentials |
| `/fa/booking/doctor/{slug}/reserve`| `src/app/[locale]/(booking)/booking/doctor/[slug]/reserve/page.tsx`| Booking | JalaliWeekCalendar, SlotMatrix, actions.ts |
| `/fa/booking/diagnostic-services` | `src/app/[locale]/(booking)/booking/diagnostic-services/page.tsx` | Catalog / Booking | ServiceCard, SubspecialtyFilter |
| `/fa/booking/therapy-services` | `src/app/[locale]/(booking)/booking/therapy-services/page.tsx` | Catalog / Booking | TherapyCategoryGrid, ProcedureDetail |
| `/fa/foods` & `/fa/foods/{slug}` | `src/app/[locale]/(nutrition)/foods/[slug]/page.tsx` | Nutrition | 40MicronutrientTable, MacroNutrientChart |
| `/fa/food-analysis/*` | `src/app/[locale]/(nutrition)/food-analysis/page.tsx` | Nutrition | MetabolismCalculator, MifflinStJeor math engine |
| `/fa/booking/offline-diet/*` | `src/app/[locale]/(nutrition)/diets/page.tsx` | Nutrition | DietTierCards, DietFunnelWizard |
| `/registry/form/{id}/*` | `src/app/[locale]/(account)/registry/page.tsx` | Clinical Engine | 8StageMedicalWizard, AnthropometricEngine |
| `/fa/profile/reservations` | `src/app/[locale]/(account)/appointments/page.tsx` | Booking / Account | ReservationTable, CancelSlotModal |
| `/fa/profile/personal-info` | `src/app/[locale]/(account)/settings/page.tsx` | Identity | ProfileForm, better-auth client |
| `/fa/articles` & `/fa/article/{slug}`| `src/app/[locale]/(content)/articles/[slug]/page.tsx` | Content | ArticleReader, PDFDownloadButton, SocialShare |
| `/fa/knowledge/faq` | `src/app/[locale]/(content)/faq/page.tsx` | Content | ClinicalFaqAccordion (37 verified Q&As) |
| `/fa/knowledge/pamphlet` | `src/app/[locale]/(content)/pamphlets/page.tsx` | Content | PamphletGrid, DirectPDFDownload |
| `/fa/knowledge/videos` | `src/app/[locale]/(content)/videos/page.tsx` | Content | AparatVideoEmbed, VideoCard |
| `/login` & `/register` | `src/app/[locale]/(auth)/signin/page.tsx` | Identity | PhoneOTPInput, better-auth HMAC SHA-256 |

---

## 5. Verification Checklist & Completeness Certification

- [x] **Public Catalog & Landing Surfaces:** Fully charted with all search queries, meal sliders, and carousel triggers.
- [x] **Physicians & Specialties:** 13 official medical specialties mapped; search, filter drawer, and profile pages detailed.
- [x] **Interactive Slot Booking Calendar:** Complete authentication walls, 2,000 Tomans deposit mechanics, Jalali month slider, weekly slot matrix, and Shaparak gateway transitions mapped.
- [x] **Diagnostic & Therapeutic Hubs:** All 6 diagnostic categories (ECG, Holter, Echo, Nuclear scan, etc.) and therapy categories mapped.
- [x] **Auxiliary Services:** Rehabilitation (5 fields), Home Care (4 services), Ambulance transport (3 tiers), and Medical complexes mapped.
- [x] **Healthy Food Database:** All 40+ clinical micronutrients, macronutrient distributions, and recipe views indexed.
- [x] **Food Analysis & Calorie Tracking:** 5-tier PAL biometric inputs, traditional Persian portion measurements (`کف دست`, `لیوان`, `قاشق`, `بشقاب`, `کفگیر`), and BMR/TDEE math charted.
- [x] **Educational Magazine:** 14 health knowledge topics, article reader with scientific PDF downloads, pamphlets, 37 FAQ items, and Aparat video player mapped.
- [x] **Authenticated Patient Portal (`09015267167`):** Active/expired reservations with cancellation rules, profile settings, wallet deposit and ledger, and clinical doctor messages mapped.
- [x] **8-Stage Clinical Registry Wizard:** All 8 diagnostic stages (Demographics, Medical History, Drugs, Lifestyle, Diet habits, CVD screening, Anthropometrics, Lab uploads) specified with exact inputs.
- [x] **Offline Diet Subscription App:** 18 diet categories, 4 subscription tiers (Bronze 170k, Silver 350k, Gold 660k, VIP 860k), 6-stage funnel, BMI calculator, weight chart, and Goftino support mapped.
- [x] **Corporate & Legal:** About, Contact, Work with Us B2B form, Site Help (7 guides), Terms & Conditions (cancellation fee structure), Complaints form mapped.
- [x] **Zero UI/UX styling fluff:** Strictly functional architecture, routes, fields, buttons, and workflows.
