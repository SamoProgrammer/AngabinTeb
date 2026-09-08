# Angabin Teb — Production-Readiness Spec (synthesis of 3 reviews)

**Date:** 2026-09-05 · **Status:** Ready for implementation
**Synthesizes:** (1) feature/spec gap analysis F-001→F-026, (2) two-axis code review of the Stitch overhaul diff, (3) architecture deepening review. Duplicates removed; each item appears once.
**Standing order:** pre-launch — delete freely, rename params, change schema via fresh migrations or reset. No backward-compat shims, no deprecation paths, no prod data to protect.
**No tracker configured** (`docs/agents/issue-tracker.md` absent) — this file is the spec source of truth until `/setup-matt-pocock-skills` + `/to-tickets` run.

---

## Problem Statement

The Stitch UI/UX overhaul shipped 48 routes that look production-complete, but three independent reviews found the same underlying condition: the UI presents certainty the backend does not have. Discovery pages render fake doctors when the database is empty, the same metabolic equation exists twice with different answers, the booking guard that matters lives in SQL while tests assert a pure mirror of it, and the English/Arabic locales render Persian. A user or demo on an empty database sees plausible fiction; a second developer fixing a bug fixes it in the wrong layer.

## Solution

A single hardening pass, ordered so each phase exposes the truth the next phase needs: first delete every fake-data merge so empty states are honest, then unify the duplicated equation, then test booking through the seam that actually enforces capacity, then make locales real, then fix seeds and content truth, then paid flows, then hygiene. Nothing new is built until what exists is honest.

## Test Seams

Highest seam wins; one seam per concern. These were checked against the implementer before writing (flagged inline where new).

1. **Equation seam** — one unified BMR/TDEE module; the client widget and the server nutrition query become adapters of it. Both existing seams collapse into this one.
2. **Catalog query seam** — doctor/service/search/topic/food queries. Pages are not a test surface; assert empty/seeded/error behavior through the queries.
3. **Booking action seam** — the transactional booking action (the existing test-only seam used by the double-book journey test). Concurrency, hold-expiry, and party-size tests go through it against a disposable database, not through the pure kernel mirror.
4. **Localization seam** — one deepened module that takes entity type + ids + locale + fields and returns overlaid rows, fetching overrides itself. Replaces the current 5-argument overlay helper at every call site.
5. **Support/admin seams** — unchanged; status-only queue and admin CRUD already test through their actions.

## User Stories

### Honest discovery (patient)

1. As a patient opening the doctors directory on an empty database, I see an empty state, so that I never mistake demo cards for real physicians.
2. As a patient opening a doctor profile, I see only stored credentials, fees, and slots, so that I can trust the booking decision.
3. As a patient browsing services, I see stored preparation instructions and prices, so that I arrive prepared and am not surprised at the clinic.
4. As a patient searching, I get results from the real index across doctors, services, and content, so that one search box answers any intent.
5. As a patient confirming a booking, I see my own name, service, slot, and tracking code on the receipt, so that I have proof of reservation.
6. As a patient on the landing page, I see the same doctors, services, and articles the directories show, so that the homepage never contradicts the catalog.

### Correct nutrition (patient)

7. As a patient using the landing-page metabolism widget, I get the identical BMR/TDEE the food diary uses as my target, so that my calorie budget matches my plan.
8. As a patient saving my body profile, I get validated BMR/TDEE/BMI persisted to my record, so that all nutrition math shares one source.
9. As a patient logging food in traditional units, I see nutrients computed per-100g through serving-unit gram equivalents, so that a ladle or plate is measured correctly.
10. As a patient viewing my diary, I see intake versus requirement deficits, so that I know what I lack.

### Reliable booking (patient)

11. As a patient booking a slot, I cannot double-book a slot another patient just took, so that my confirmation is always real.
12. As a patient booking for family, I can set party size within capacity, so that group visits are honored.
13. As a patient who mistyped, I can reschedule through cancel-plus-create, so that history is preserved and capacity is freed.
14. As a patient entering my name and phone at booking, I see them on my receipt and in my appointments, so that my identity travels with the booking.

### Real locales (en/ar reader)

15. As an English reader, I read the landing, discovery, booking, diary, and content pages in English with correct LTR layout, so that the product is usable without Persian.
16. As an Arabic reader, I read the same pages in Arabic with correct RTL layout, so that direction never breaks structure.
17. As any reader switching locale, I stay on the same page with fonts and direction reloaded, so that switching is seamless.

### True content (reader)

18. As a reader opening an article, I see its real author, topic, and reading time, so that authorship is trustworthy.
19. As a reader browsing videos, I see real speakers and durations, so that I can choose what to watch.
20. As a reader opening the FAQ, I see curated live entries, so that answers reflect current policy.
21. As a reader opening a topic hub, I see its articles plus related doctors and services, so that learning leads to care.

### Paid content (patient)

22. As a patient claiming a priced diet program, I complete the required payment/approval step before download, so that paid work is protected.
23. As a patient who claimed a program, I can always re-access my download, so that I keep what I acquired.

### Operator (admin)

24. As an admin viewing the overview, I see true counts of providers, services, appointments, foods, and open requests, so that I operate on facts.
25. As an admin managing providers, services, locations, categories, foods, diets, content, and topics, I create and edit in three locales, so that en/ar stay complete.
26. As an admin generating slots from a weekly pattern, I get overlap-free concrete slots, so that booking never offers impossible times.
27. As an admin triaging support, I update status on a status-only queue, so that no request is lost.

## Implementation Decisions

### A. Truth in discovery (do first — exposes everything else)

- **A1.** Delete all hardcoded fallback/sample/featured merges in discovery, profile, receipt, and landing modules. Empty database renders the shared empty state; failing queries render the shared error state. Demo content lives in seeds, never in page modules.
- **A2.** Wire the landing module to the same catalog and content queries as the directories (bounded limits), removing its fully-mocked status.
- **A3.** One shared empty-state and one shared error-state module reused by every discovery and content page.

### B. One metabolism equation

- **B1.** Single equation module owning Mifflin-St Jeor BMR, activity-factor TDEE, BMI, and macro split. Canonical parameter names: sex, weightKg, heightCm, age. Rounding and display formatting belong to adapters, not the equation.
- **B2.** The client widget and the server nutrition query become adapters of B1. Delete the duplicate; no compatibility alias.
- **B3.** One shared numeric test vector asserted through both adapters (widget math and persisted diary targets agree exactly).

### C. Booking hardening

- **C1.** The conditional capacity-guarded slot update stays in SQL (it is the enforcement point). The pure kernel shrinks to predicates the transactional action actually invokes; unenforced mirrors are deleted.
- **C2.** Concurrency (double-book), hold-expiry, and party-size tests run through the booking action seam on a disposable database. Prior art: the existing double-book journey test.
- **C3.** Booking input gains first-class optional patient name and phone fields; the client stops folding the name into the notes string. Appointment stores them as columns (fresh migration; no backfill — no prod data).
- **C4.** Ship the reschedule user journey (cancel-plus-create with capacity re-check) in the appointments module; the kernel plan function already exists.
- **C5.** Keep the payment-status column as inert data; do not surface price/payment state in booking UI. Paid flows belong to downloadable content (F), never appointments — purge ruling stands.

### D. Real locales

- **D1.** The five high-traffic pages (landing, doctors, services, booking, diary) move all strings into the message catalogs first; remaining pages follow. Persian is the source of truth; en/ar are overrides sharing stable IDs.
- **D2.** Replace all physical direction props with logical ones across page and booking/nutrition modules (vendored UI primitives excluded). English renders LTR, Persian/Arabic RTL, verified per page.
- **D3.** All icons render through the clinical icon module; raw inline SVG in pages is removed.
- **D4.** Drop the "optional Lucide fallback" design requirement; Material Symbols is the single iconography. (Pre-launch simplification; re-add only on a real glyph gap.)

### E. Content and seed truth

- **E1.** Seeds provide all four specified physician personas with correct specialties and council codes (cardiologist and gastroenterologist rows are missing; the nutritionist row is mis-specialized and must be corrected, not duplicated).
- **E2.** Seeds provide the specified foods with the specified serving units and energies, plus at least one row of the downloadable pamphlet content kind.
- **E3.** Article author/topic/reading-time, video speaker/duration/summary, and FAQ entries come from stored data or the fields are removed from the UI. No index-derived placeholder text; default FAQ list is deleted once live entries exist.

### F. Paid content, location, reputation (product calls with locked defaults)

- **F1 (default: claim-gate).** Priced diet/downloadable content requires a claim record before the download is served; owners can always re-access. If online payment arrives later, it attaches to the claim, not to appointments.
- **F2 (default: link stays).** Keep the external map link on profiles; embedded maps stay out until a clinic asks for them. Location remains plain stored coordinates.
- **F3 (default: drop fakes).** Remove hardcoded ratings, review counts, and testimonials. A review table is added only when moderation ownership is decided; until then no scores are shown.

### G. Hygiene (last)

- **G1.** Deepen the translation helper into the localization seam (fetches overrides internally); migrate all query modules to it; delete the 5-argument form.
- **G2.** Exclude end-to-end specs from the unit runner config so unit runs stay green without a live server; e2e runs only under Playwright with a seeded database.
- **G3.** Test-only routes are production-guarded by environment; the test login signs session cookies with the auth library's own signer (delete the hand-rolled HMAC).
- **G4.** Production SMS provider plus OTP/booking rate limits; development keeps the log stub behind an explicit flag.
- **G5.** Loading and error boundaries on discovery and booking routes; server-side pagination on doctors and services matching the existing foods/articles pattern.
- **G6.** Deduplicate the trilingual header navigation data into one dictionary lookup (no behavior change); fix remaining physical props in header dropdowns as part of D2.

## Testing Decisions

- **What makes a good test here:** asserts externally visible behavior through the highest seam (query result, booking outcome, rendered empty state, localized string), never implementation details (SQL text, CSS classes, component trees). A test that passes while the user sees fiction is a bad test — this codebase already has that failure mode, and every fallback deletion must be covered by an empty-database test proving honesty.
- **Modules tested:** equation module (shared vector through both adapters); catalog queries (seeded + empty + error); booking action seam (concurrent double-book, expired hold, party-vs-capacity, reschedule frees capacity); localization seam (override scoping per entity type); slot generation (pattern expansion, overlap, holiday exclusion); nutrition pipeline (unit→grams→nutrients→rollup→deficit hand-checked).
- **Prior art:** nutrition and booking kernel unit tests, metabolism widget tests, layout chrome tests, the double-book journey test (promote its pattern from e2e-only into the booking seam suite), Playwright journeys for find-and-book, food logging, and topic-to-article.
- **Gates (unchanged):** typecheck zero errors, linter zero errors, unit suite green without a server, production build clean, visual pass in all three locales.

## Out of Scope

The five purged subsystems stay deleted (appointment payments, home-care serviceability, ambulance dispatch, provider portal, support assignment). Deferred per the open-questions ledger: insurance, calendar sync, refund policy beyond downloads, no-show enforcement. Also out: email delivery, native apps, public API, live tracking, embedded maps (F2), review moderation (F3), online payment gateway (attaches later to F1 claims).

## Further Notes

- **Order of attack:** A → B → C → D → E → F → G. A exposes reality; B removes a divergence risk (~30 lines); C is the only reliability load-bearer; D is the largest visible win; E/F need the honest UI from A/D to land on; G is hygiene that pays off only after the seams exist.
- **Suggested first two slices (each < half day):** A1 fallback deletion with empty-state tests; B1+B2 equation unification with the shared vector.
- **Evidence pointers:** per-file findings live in the two prior review reports (code-review output and the architecture HTML report in the OS temp dir); this spec intentionally carries no file paths so it survives the refactor it orders.
- **Next step after approval:** break this spec into blocking-ordered tickets (translations and slot UI unblock nothing; A1 unblocks E; B unblocks diary-target work; C2 unblocks any booking UI promise).
