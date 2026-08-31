# Angabin Teb — AI-Ready Product Specification

> **Document type:** AI-ready Product Requirements & Feature Specification (PRD + requirements-specification hybrid)
> **Product:** Angabin Teb / انگبین طب
> **Source analyzed:** https://www.angabinteb.com/fa
> **Source basis:** Publicly accessible website content and representative linked feature flows inspected on 2026-08-14.
> **Primary purpose:** Give humans and AI agents a durable, feature-centric understanding of what Angabin Teb does, why each capability exists, how capabilities relate, and what a modern replacement must preserve or improve.
> **Status:** Reverse-engineered baseline; not a statement of the target implementation.

---

## 0. How to read this document

This document describes **capabilities**, not a 1:1 recreation of the current website.

Each feature is specified in terms of:

- **Purpose** — why the feature exists.
- **Actors** — who uses or operates it.
- **Inputs** — information the feature needs.
- **Behavior** — what the feature does.
- **Outputs** — what the user or another system receives.
- **Dependencies** — related capabilities or data.
- **Business rules** — important constraints inferred from the current product.
- **Current evidence** — what was directly observed publicly.
- **Modernization direction** — what should be preserved, consolidated, or improved.

### Evidence labels

- **CONFIRMED** — directly observed on the public site.
- **INFERRED** — strongly implied by observed behavior/data, but not directly verified.
- **UNVERIFIED** — plausible capability that requires authenticated/operational access to confirm.

Do not convert INFERRED or UNVERIFIED items into implementation requirements without validation.

---

# 1. Product definition

## 1.1 Product summary

Angabin Teb is a multi-domain healthcare platform centered on nutrition and care access. It combines:

1. Healthcare discovery and booking.
2. Doctor and provider profiles.
3. Diagnostic services.
4. Therapy services.
5. Home healthcare.
6. Rehabilitation and other care providers.
7. Diet acquisition.
8. Food and nutrient analysis.
9. A food/nutrition database.
10. Health and nutrition education.
11. User accounts and personalized health functions.
12. Support, complaint, institutional, and trust information.

The product is therefore better modeled as a **healthcare access + nutrition + knowledge platform** than as a clinic brochure site.

## 1.2 Core user promise

> Help a person find appropriate care, book it, manage personalized nutrition/health information, and learn how to improve their health.

## 1.3 Primary user groups

| Actor | Primary jobs |
|---|---|
| Patient / consumer | Find care, book, manage appointments, get diet, analyze food, learn |
| Care seeker | Find a doctor/service by specialty, treatment, location, or need |
| Nutrition user | Record body information, food intake, diet, calories, nutrients |
| Healthcare provider | Present credentials/services and receive bookings |
| Clinic / organization | Offer services, locations, and/or diet programs |
| Content consumer | Read articles, FAQs, guides, videos |
| Support user | Ask questions, request help, submit complaints |
| Operator / admin | INFERRED — manage providers, services, content, availability, and users |

---

# 2. Product capability map

```text
Angabin Teb
│
├── Care Discovery
│   ├── Doctor discovery
│   ├── Service discovery
│   ├── Clinic/provider discovery
│   └── Location filtering
│
├── Care Booking
│   ├── Doctor appointments
│   ├── Diagnostic bookings
│   ├── Therapy bookings
│   ├── Home-care bookings
│   ├── Rehabilitation bookings
│   └── Other bookable services
│
├── Nutrition
│   ├── Diet acquisition
│   ├── My Body / physiology profile
│   ├── Food diary / food analysis
│   ├── Calorie counting
│   └── Food & nutrient database
│
├── Health Knowledge
│   ├── Nutrition knowledge
│   ├── Articles
│   ├── Pamphlets / guides
│   ├── FAQs
│   └── Videos
│
├── Account & Support
│   ├── Login / registration
│   ├── Password recovery
│   ├── Personalized health area
│   └── Support / complaints
│
└── Institutional / Trust
    ├── About
    ├── Contact
    ├── Collaboration
    ├── Terms
    └── Trust / social channels
```

---

# 3. Feature inventory

## F-001 — Global care discovery

**Priority:** P0  
**Status:** CONFIRMED / target modernization core

### Purpose
Provide one place where users can discover doctors, healthcare services, clinics, providers, and related care options.

### What it does
- Accepts a user intent such as a specialty, service, condition, or care type.
- Returns relevant people, services, providers, and locations.
- Supports filtering by category and geography.
- Connects discovery to the booking system.

### Current evidence
The current platform separates doctors, diagnostic services, therapy services, rehabilitation, home clinical services, offices, and clinics into parallel entry points. Doctor and diagnostic sections visibly support category/location filtering.

### Inputs
- Search query.
- Specialty.
- Service category.
- Location/city.
- Care type.

### Outputs
- Matching doctors.
- Matching services.
- Matching providers/locations.
- Links to profiles and booking.

### Modernization direction
Replace fragmented discovery with a unified intent-based search and filters.

### Acceptance criteria
- A user can search without knowing the platform's internal taxonomy.
- Search can return multiple entity types.
- Results can be filtered by specialty/category and location.
- Every bookable result has a clear next step.

---

## F-002 — Doctor discovery

**Priority:** P0  
**Status:** CONFIRMED

### Purpose
Help users find an appropriate physician/practitioner.

### What it does
- Lists doctors by specialty.
- Supports location filtering.
- Opens an individual doctor profile.
- Connects a doctor to appointment booking.

### Observed specialty examples
Nutrition, gastroenterology, gynecology, cardiology, pediatrics, genetics, endocrinology, neurology, orthopedics, urinary tract, dermatology/beauty, breast surgery, and others.

### Doctor entity
A doctor can contain:
- Name.
- Specialty.
- Location.
- Photo.
- Biography.
- Education/credentials.
- Professional activity.
- Awards/recognition.
- Publications/research details.
- Video/media.
- Resume/CV download.
- Address.
- Phone.
- Map/location.
- Booking capability.

### Modernization direction
Treat Doctor as a canonical provider entity with structured credentials and availability instead of a content-heavy page only.

---

## F-003 — Doctor profile

**Priority:** P0  
**Status:** CONFIRMED

### Purpose
Build trust and help the user decide whether to book a practitioner.

### What it does
Combines identity, professional proof, service information, location, and booking access.

### Key components
- Profile image.
- Professional title.
- Specialty.
- Credentials.
- Biography.
- Awards/research.
- Media/video.
- Address.
- Phone.
- Map.
- CV.
- Book button.

### Current example
The public profile for Dr. Majid Ghayour Mobarhan includes professional credentials, a CV, video, address, phone, and an interactive map, plus appointment booking.

### Modernization direction
Move the primary decision-making information above the fold and make availability/bookability continuously visible.

---

## F-004 — Unified service catalog

**Priority:** P0  
**Status:** CONFIRMED concept / INFERRED consolidation

### Purpose
Let a user discover something they need to receive, regardless of whether the item is a diagnosis, treatment, home service, rehabilitation service, or consultation.

### Current service families
- Diagnostic services.
- Therapy/treatment services.
- Rehabilitation.
- Home clinical services.
- Other consultation/service types.
- Private ambulance is also a first-class navigation category.

### Canonical target model
```text
Service
├── service type
├── category
├── provider
├── locations
├── eligibility / preparation
├── duration
├── price (if applicable)
├── availability
└── booking capability
```

### Modernization direction
One service model with specialized fields rather than many unrelated page types.

---

## F-005 — Diagnostic services

**Priority:** P0  
**Status:** CONFIRMED

### Purpose
Help users discover and book diagnostic procedures.

### Current capabilities
- Diagnostic category browsing.
- Category filters.
- Location filtering.
- Service detail pages.
- Booking entry points.

### Observed diagnostic families
- Cardiovascular.
- Nutrition-related diagnostics.
- Gastroenterology/liver.
- Laboratory.
- Nuclear medicine.

### Examples of bookable procedures publicly exposed
- ECG.
- Echocardiography.
- Angiography.
- Stress echo.
- Heart scan.
- Bone-density-related examinations.
- Gastrointestinal procedures.
- Endoscopy.
- Colonoscopy.
- Thyroid/parathyroid scans.
- Kidney scans.
- Body-composition analysis.
- Blood/specialized nutrition testing.

### Modernization direction
Each diagnostic service should communicate purpose, preparation, duration, location, provider, price/coverage when applicable, and availability before booking.

---

## F-006 — Therapy / treatment services

**Priority:** P0  
**Status:** CONFIRMED

### Purpose
Enable discovery and booking of therapeutic services.

### Current categories/examples
- Local slimming/body contouring.
- Skin.
- General surgery.
- Sports physiology.
- Psychology.
- Gastroenterology.

### Current behavior
Services can be browsed, viewed individually, and routed to reservation.

### Modernization direction
Use the same service-detail and booking components as diagnostics while allowing therapy-specific fields.

---

## F-007 — Home healthcare

**Priority:** P1
**Status:** CONFIRMED category / UNVERIFIED full operational flow

### Purpose
Allow care to happen at the patient's location.

### Current evidence
A dedicated home clinical services area exists, including at least one provider/organization and links into care filtering.

### Target behavior
- Choose home service.
- Enter/confirm address.
- Determine service availability.
- Select provider and time.
- Book.

### Unverified
The current public extraction does not establish the complete scheduling, dispatch, pricing, or live-tracking workflow.

---

## F-008 — Rehabilitation

**Priority:** P1  
**Status:** CONFIRMED category / UNVERIFIED detailed operations

### Purpose
Offer rehabilitation-related providers/services through the broader care platform.

### Current evidence
A distinct rehabilitation section exists and routes to provider/service filtering.

### Modernization direction
Treat rehabilitation as a service family within the universal service catalog.

---

## F-009 — Private ambulance

**Priority:** P2
**Status:** CONFIRMED category / UNVERIFIED detailed workflow

### Purpose
Provide access to private ambulance services.

### Current evidence
Private ambulance is exposed as a first-class navigation/service category.

### Unknowns requiring validation
- Emergency vs scheduled use.
- Vehicle types.
- Geographic serviceability.
- Dispatch model.
- ETA tracking.
- Pricing.
- Driver/crew experience.
- Payment.

Do not invent these as existing functionality.

---

## F-010 — Unified appointment booking

**Priority:** P0  
**Status:** CONFIRMED core behavior / target consolidation

### Purpose
Turn a selected doctor/service into a confirmed appointment.

### Current observed flow
```text
Select doctor/service
→ reservation page
→ authentication required
→ appointment booking
```

### Observed authentication behavior
The current reservation page explicitly requires the user to log in or create an account before continuing.

### Current special behavior
A reservation concept called individual appointment is present, with patient-count choices such as 2, 3, and 4 people in the inspected example.

### Target behavior
```text
Choose service/provider
→ choose date/time
→ identify patient
→ verify phone / sign in
→ review
→ confirm / pay
→ appointment created
```

### Core appointment entity
```text
Appointment
├── patient
├── bookable service
├── provider
├── location
├── slot
├── status
├── price/payment
├── notes
└── notifications
```

### Acceptance criteria
- The same booking engine can support different bookable types.
- Availability is understandable before commitment.
- Authentication does not unnecessarily block discovery.
- A successful booking produces a durable appointment record.
- Cancellation/rescheduling states are explicit.

---

## F-011 — Diet acquisition

**Priority:** P0  
**Status:** CONFIRMED

### Purpose
Allow users to obtain a diet/nutrition plan through structured programs.

### Current behavior
The diet entry asks the user to select an organizational context:
- Banks.
- Universities.
- Health centers.
- Clinics.
- Other.

These selections lead to offline-diet collections.

### Business meaning
Diet is not modeled purely as a generic consumer product; it has organizational/program distribution contexts.

### Canonical target model
```text
Diet Program
├── organization/context
├── plan type
├── duration
├── eligibility
├── price
├── practitioner
└── delivery model
```

### Modernization direction
Make program context explicit and keep the acquisition flow understandable to the end user.

---

## F-012 — Food analysis

**Priority:** P0  
**Status:** CONFIRMED

### Purpose
Measure a user's actual food intake against nutrition needs.

### Current capability
The public product describes a food-analysis application containing Iranian and international foods.

Users can:
- Select a food.
- Specify quantity.
- Use real-world serving units such as plate, ladle, and spoon.
- Enter physiological information.
- See macro- and micronutrient intake.
- Compare actual intake against required intake.
- Identify potential nutrient deficiencies.

### Physiological inputs
- Age.
- Sex.
- Weight.
- Height.

### Macro outputs
- Energy.
- Carbohydrate.
- Protein.
- Fat.

### Micro outputs
- Vitamins.
- Minerals.

### Current authentication dependency
The public entry point states that an account is required to continue and links to personal physiological data, help, and the logged-in nutrition area.

### Modernization direction
Turn this into a first-class nutrition workspace instead of a secondary site feature.

---

## F-013 — My Body / physiological profile

**Priority:** P1  
**Status:** CONFIRMED route / partially inferred behavior

### Purpose
Store the personal physiological data needed for nutrition calculations.

### Likely data
- Age.
- Sex.
- Height.
- Weight.
- Activity level.

Only the first four are directly described by the public food-analysis content; activity is strongly suggested by the broader nutrition-analysis description and should be validated before treating as a required stored field.

### Modernization direction
Make this a reusable profile consumed by diet, calorie, food-analysis, and potentially goal-setting features.

---

## F-014 — Calorie counter

**Priority:** P1  
**Status:** CONFIRMED route / partial public evidence

### Purpose
Track or estimate calorie intake as part of the nutrition workspace.

### Current evidence
The authenticated nutrition area exposes a calorie-counter destination.

### Unverified
The exact current interaction model and calculation rules require authenticated inspection.

---

## F-015 — Food database

**Priority:** P1  
**Status:** CONFIRMED

### Purpose
Provide searchable food/meal records used by both end users and nutrition functions.

### Current food record fields
- Food image.
- Name.
- Serving description.
- Calories.
- Meal-type/category context.

### Current examples
Breakfast and meal records include Iranian/local foods as well as broader dishes.

### Target data model
```text
Food
├── localized names
├── aliases
├── category
├── meal type
├── image
├── serving units
├── energy
├── macronutrients
├── micronutrients
└── source/version
```

### Modernization direction
Make food data a reusable domain service rather than a homepage content carousel.

---

## F-016 — Health content system

**Priority:** P1  
**Status:** CONFIRMED

### Purpose
Educate users and support health-related discovery.

### Current content types
- Nutrition knowledge.
- Articles.
- Educational pamphlets/guides.
- FAQs.
- Educational videos.

### Current taxonomy examples
- Nutrition across life stages.
- Fitness/weight management.
- Gastrointestinal disease.
- Diabetes.
- Pulmonary disease.
- Rheumatology.
- Thyroid disease.
- Anemia.
- Cancer.
- Neuropsychiatric conditions.
- Cardiovascular disease.

### Modernization direction
Use one health-content platform with reusable topic/condition/life-stage taxonomy.

---

## F-017 — Health topic hub

**Priority:** P1  
**Status:** INFERRED target feature based on existing content taxonomy

### Purpose
Group all useful information around a health topic, condition, or life stage.

### Example target
```text
Diabetes
├── Articles
├── Food guidance
├── FAQs
├── Videos
├── Diet resources
└── Relevant doctors/services
```

This is not a claim that the current website already exposes this exact unified hub; it is the recommended modernization of the existing fragmented content inventory.

---

## F-018 — User authentication

**Priority:** P0  
**Status:** CONFIRMED

### Current capabilities
- Login.
- Registration.
- Password recovery.
- Account-required access for some personalized/booking functions.
- Gender selection during registration.
- Nationality selection.

### Publicly observed nationality options
Iran, Iraq, Afghanistan, Pakistan, Syria, Lebanon.

### Modernization direction
Use phone-first/OTP-friendly authentication where operationally appropriate, while preserving a secure account identity usable across appointments and nutrition features.

---

## F-019 — Personalized health workspace

**Priority:** P0  
**Status:** PARTIALLY CONFIRMED / target consolidation

### Purpose
Give a signed-in user one place to manage everything connected to their care and nutrition.

### Existing evidence
Authenticated nutrition destinations include:
- My Body.
- Diet.
- Food analysis.
- Home.
- Calorie counter.
- Support.

### Recommended workspace
```text
My Health
├── Upcoming appointments
├── Past appointments
├── My diet
├── My body
├── Food analysis
├── Calorie/nutrition tracking
├── Payments
└── Support
```

---

## F-020 — Support and help

**Priority:** P1  
**Status:** CONFIRMED

### Current capabilities
- FAQ.
- Site help.
- Contact.
- Complaint registration.
- Support destination in the nutrition workspace.

### Modernization direction
Consolidate into a support center with:
- searchable help;
- ticket/request creation;
- complaint handling;
- appointment-specific support;
- nutrition-specific support;
- status tracking.

---

## F-021 — Complaints

**Priority:** P1  
**Status:** CONFIRMED

### Purpose
Provide a formal escalation channel.

### Current evidence
A dedicated complaint destination exists.

### Modernization direction
Create a structured complaint/request record linked when possible to:
- user;
- appointment;
- provider;
- service;
- topic;
- status.

---

## F-022 — Multilingual product

**Priority:** P1  
**Status:** CONFIRMED

### Current languages
- Persian.
- English.
- Arabic.

### Modernization requirement
Language should be a content/data concern, not a duplicated-page concern.

### Recommended model
```text
Entity
├── fa
├── en
└── ar
```

Keep stable IDs across translations.

---

## F-023 — Provider/location model

**Priority:** P1  
**Status:** INFERRED from public data

### Purpose
Support doctors, clinics, offices, organizations, and home-care providers without treating them as the same thing.

### Recommended model
```text
Provider
├── Person
│   └── Doctor/clinician
└── Organization
    ├── Clinic
    ├── Office
    └── Service organization

Location
├── physical location
├── city/region
└── serviceability
```

---

## F-024 — Location/maps

**Priority:** P1  
**Status:** CONFIRMED on doctor profiles

### Current capabilities
- Address presentation.
- Phone presentation.
- Interactive map.

### Current public technology evidence
The inspected doctor profile references Leaflet, OpenStreetMap, and Mapbox.

### Modernization direction
Make location reusable across doctors, services, clinics, and home-care serviceability.

---

## F-025 — Media/video

**Priority:** P2  
**Status:** CONFIRMED

### Current capability
Doctor profile content includes embedded video hosted through Aparat; the site also contains educational videos as a separate content family.

### Modernization direction
Use a unified media entity with provider/education context rather than bespoke embeds inside pages.

---

## F-026 — External service integrations

**Priority:** P1
**Status:** CONFIRMED

### Observed integrations/relationships
- Regim24 — offline-diet destination.
- Nobat24 — booking ecosystem link.
- Aparat — video hosting.
- Leaflet/OpenStreetMap/Mapbox — mapping.
- eNAMAD trust seal.
- Instagram, Telegram, Facebook.

### Modernization requirement
All external dependencies should be explicitly documented as integrations with ownership, fallback behavior, and data boundaries.

---

# 4. Cross-feature domain model

## 4.1 Core entities

```text
User
PatientProfile
Provider
Practitioner
Organization
Clinic
Office
Location
Service
ServiceCategory
Appointment
AvailabilitySlot
Payment
DietProgram
DietPlan
PhysiologyProfile
Food
ServingUnit
Nutrient
FoodIntake
NutritionAnalysis
Content
Topic
Condition
Media
SupportRequest
Complaint
Notification
LanguageVariant
```

## 4.2 Important relationships

```text
User ──< Appointment >── Provider
                    │
                    ├── Service
                    ├── Location
                    └── AvailabilitySlot

User ── 1:1 ── PhysiologyProfile
User ──< FoodIntake >── Food
FoodIntake ──> NutritionAnalysis
User ──< DietPlan

Provider ──< Service
Organization ──< Location
Content ──< Topic / Condition
Doctor ──< Media
User ──< SupportRequest
Appointment ──< SupportRequest
```

---

# 5. Cross-feature user journeys

## Journey J-001 — Find and book a doctor

```text
Intent
→ search/filter
→ doctor result
→ doctor profile
→ availability
→ patient
→ authentication/verification
→ confirmation
```

## Journey J-002 — Book a diagnostic service

```text
Intent
→ diagnostic category
→ service
→ provider/location
→ preparation/details
→ availability
→ booking
```

## Journey J-003 — Get a diet

```text
Need diet
→ program/context
→ diet offering
→ eligibility/details
→ acquisition
→ personalized diet area
```

## Journey J-004 — Analyze food intake

```text
Sign in
→ My Body / physiology
→ choose food
→ choose serving/quantity
→ repeat for intake
→ calculate nutrients
→ compare intake vs needs
```

## Journey J-005 — Learn about a health issue

```text
Search topic/condition
→ topic hub
→ article/guide/video/FAQ
→ related food guidance
→ related doctors/services
→ booking
```

---

# 6. Business rules inferred from the current product

These are useful working assumptions, not a substitute for operational validation.

1. Some transactions require a registered/authenticated user.
2. Doctors and services can be bookable entities.
3. Location is important to care discovery and availability.
4. A doctor can have a physical practice location.
5. Personalized nutrition analysis depends on user physiological information.
6. Food intake is represented in practical serving units, not grams only.
7. The platform contains a significant structured food/nutrient database.
8. Diet offerings can be distributed by organizational context.
9. Content is categorized by health/nutrition topic.
10. The product operates in Persian, English, and Arabic.
11. Some product capabilities depend on external services.

---

# 7. Non-functional requirements for the modern replacement

These are target requirements for a production-grade redesign, not claims about the current implementation.

## NFR-001 — RTL and localization

- Persian must be first-class RTL.
- Arabic must be first-class RTL.
- English must be first-class LTR.
- Layout must remain structurally correct when direction changes.
- Translated entities should share stable IDs.

## NFR-002 — Accessibility

- Keyboard-accessible controls.
- Visible focus state.
- Sufficient text/control contrast.
- Semantic labels for form fields.
- Screen-reader-compatible navigation.
- Accessible error and success states.
- Touch targets appropriate for mobile use.

## NFR-003 — Mobile-first

Booking, search, account, nutrition logging, and support must be fully usable on mobile without desktop-only interaction assumptions.

## NFR-004 — Performance

- Fast initial rendering.
- Progressive image loading.
- Search/filter responses should feel immediate.
- Large content libraries should use pagination/incremental loading.

## NFR-005 — Privacy and security

The system handles health-related and personal data. The modern architecture must therefore enforce:
- strong authentication;
- authorization boundaries;
- secure storage;
- auditability where needed;
- careful logging;
- least-privilege access;
- secure file/media handling.

## NFR-006 — Reliability

Booking and payment-related operations need idempotent/transaction-safe behavior so duplicate submissions do not create duplicate appointments or charges.

## NFR-007 — Traceability

Every important functional requirement should have:
- a stable ID;
- a source/evidence note;
- acceptance criteria;
- an implementation status;
- a test reference once built.

---

# 8. Information architecture principles for the redesign

The current site is organized mainly by internal service taxonomy. The new product should be organized by user intent.

## Principle 1 — Search before taxonomy

Users should be able to type what they need instead of learning the organization's menu structure.

## Principle 2 — One booking model

Doctors, diagnostics, therapy, home care, and rehabilitation should use consistent booking semantics.

## Principle 3 — One account

Appointments, diets, food analysis, body data, and support belong to one user identity.

## Principle 4 — One content system

Articles, FAQs, guides, videos, and nutrition knowledge should share common taxonomy.

## Principle 5 — Nutrition is a product, not a marketing section

Food analysis, body data, diet, calorie tracking, and food data should share a coherent workspace.

## Principle 6 — Preserve data; simplify presentation

The rebuild should preserve the valuable business/data inventory while reducing user-facing fragmentation.

---

# 9. Feature priority map

| ID | Capability | Priority | Evidence |
|---|---|---:|---|
| F-001 | Global care discovery | P0 | CONFIRMED / target |
| F-002 | Doctor discovery | P0 | CONFIRMED |
| F-003 | Doctor profile | P0 | CONFIRMED |
| F-004 | Unified service catalog | P0 | CONFIRMED / consolidation |
| F-005 | Diagnostic services | P0 | CONFIRMED |
| F-006 | Therapy services | P0 | CONFIRMED |
| F-007 | Home healthcare | P1 | CONFIRMED category |
| F-008 | Rehabilitation | P1 | CONFIRMED category |
| F-009 | Private ambulance | P2 | CONFIRMED category |
| F-010 | Unified appointment booking | P0 | CONFIRMED core behavior |
| F-011 | Diet acquisition | P0 | CONFIRMED |
| F-012 | Food analysis | P0 | CONFIRMED |
| F-013 | My Body / physiology | P1 | CONFIRMED route |
| F-014 | Calorie counter | P1 | CONFIRMED route |
| F-015 | Food database | P1 | CONFIRMED |
| F-016 | Health content system | P1 | CONFIRMED |
| F-017 | Health topic hub | P1 | Target modernization |
| F-018 | Authentication | P0 | CONFIRMED |
| F-019 | Personalized workspace | P0 | Partial current evidence |
| F-020 | Support/help | P1 | CONFIRMED |
| F-021 | Complaints | P1 | CONFIRMED |
| F-022 | Multilingual product | P1 | CONFIRMED |
| F-023 | Provider/location model | P1 | INFERRED |
| F-024 | Maps/location | P1 | CONFIRMED |
| F-025 | Media/video | P2 | CONFIRMED |
| F-026 | External integrations | P1 | CONFIRMED |

---

# 10. What the new product should not copy literally

Do not treat the current URL structure as the product model.

Avoid recreating separate top-level systems merely because the current site has separate routes for:

- doctors;
- consultants;
- diagnostic services;
- therapy services;
- home services;
- offices;
- clinics;
- articles;
- pamphlets;
- FAQs;
- videos;
- nutrition knowledge.

These should be represented by a smaller number of coherent domain models and templates.

---

# 11. Important gaps requiring deeper discovery

The public source does not fully establish the following:

## Account / patient
- OTP behavior.
- Exact profile fields.
- Health-record capabilities.
- Document uploads.
- Family members/dependents.
- Insurance handling.

## Booking
- Exact slot logic.
- Provider-side availability management.
- Payment behavior.
- Refunds.
- Rescheduling rules.
- No-show logic.
- Reminder channels.
- Calendar integrations.

## Home care
- Dispatch/serviceability logic.
- Travel fees.
- Live tracking.
- Provider assignment.

## Ambulance
- Operational dispatch model.
- Emergency semantics.
- Vehicle/crew data.
- Pricing.
- ETA tracking.

## Admin / provider portal
- Provider onboarding.
- Schedule management.
- Service management.
- Content administration.
- Reporting.
- Revenue/payment management.

## Nutrition engine
- Exact nutrient calculation formulas.
- Source/reference data.
- Recommended-intake standards.
- Goal calculations.
- Activity-factor implementation.
- Diet generation logic.

These gaps should become explicit discovery tasks rather than being silently filled with assumptions.

---

# 12. Recommended AI implementation contract

When asking an AI coding/design agent to build the new platform, require it to treat this document as the product source of truth.

For every feature implementation, the agent should answer:

1. Which feature ID is being implemented?
2. Which entities does it read/write?
3. Which user job does it satisfy?
4. What are the inputs and outputs?
5. Which business rules apply?
6. What is confirmed versus assumed?
7. What are the acceptance criteria?
8. What other features depend on it?
9. What states/errors/empty states exist?
10. What tests prove the feature works?

An AI agent must not infer that a route, button, or current HTML structure is itself a product requirement.

---

# 13. Suggested implementation phases

## Phase 1 — Core foundation

- User/authentication.
- Provider and location data model.
- Service model.
- Search.
- Doctor discovery.
- Service discovery.
- Doctor/service profiles.
- Unified appointment engine.
- Patient dashboard.

## Phase 2 — Nutrition

- My Body.
- Food database.
- Food intake logging.
- Nutrition calculations.
- Calorie counter.
- Diet acquisition.
- Nutrition workspace.

## Phase 3 — Knowledge

- Unified content model.
- Topic/condition taxonomy.
- Articles.
- Guides/pamphlets.
- FAQ.
- Video library.
- Topic hubs.

## Phase 4 — Extended care

- Home healthcare.
- Rehabilitation.
- Ambulance.
- Clinic/provider operations.
- Advanced support.

---

# 14. Source evidence

## Primary source

- Angabin Teb Persian site: https://www.angabinteb.com/fa

## Publicly observed feature areas

The analysis inspected representative public surfaces covering:

- homepage;
- doctor categories;
- diagnostic categories;
- therapy categories;
- rehabilitation;
- home clinical services;
- diet acquisition;
- food analysis;
- doctor profile;
- doctor booking/reservation entry;
- authentication;
- articles and article taxonomy;
- food records;
- multilingual navigation.

## Important source limitations

This is a public-surface reverse-engineering document. Authenticated workflows, admin/provider interfaces, operational backend behavior, and payment/dispatch internals were not fully observable and are therefore marked as inferred or unverified where relevant.

---

# 15. Change log

| Date | Change |
|---|---|
| 2026-08-14 | Initial feature-centric reverse-engineered specification created from the public Angabin Teb platform. |

