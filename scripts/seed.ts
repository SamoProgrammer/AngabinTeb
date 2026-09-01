import "dotenv/config";
import { db } from "../src/db";
import {
  users,
  translations,
  serviceCategories,
  providers,
  practitioners,
  locations,
  services,
  diagnosticServices,
  homeCareServices,
  ambulanceServices,
  availabilitySlots,
} from "../src/db/schema";

const ADMIN_ID = "admin-seed";
const PROVIDER_ID = "prov-heart-1";
const CATEGORY_ID = "cat-cardio";
const SERVICE_ID = "svc-ecg-1";
const LOCATION_ID = "loc-tehran-1";

async function upsertTranslation(entityType: string, entityId: string, locale: string, field: string, value: string) {
  await db
    .insert(translations)
    .values({ entityType, entityId, locale, field, value })
    .onConflictDoUpdate({
      target: [
        translations.entityType,
        translations.entityId,
        translations.locale,
        translations.field,
      ],
      set: { value },
    });
}

async function main() {
  await db
    .insert(users)
    .values({
      id: ADMIN_ID,
      name: "Administrator",
      phoneNumber: "09120000000",
      phoneNumberVerified: true,
      role: "admin",
    })
    .onConflictDoUpdate({ target: users.id, set: { role: "admin" } });

  await db
    .insert(users)
    .values({
      id: "admin-seed-2",
      name: "Administrator 2",
      phoneNumber: "09120000003",
      phoneNumberVerified: true,
      role: "admin",
    })
    .onConflictDoUpdate({ target: users.id, set: { role: "admin" } });

  // Location / provider / service base rows arrive with the Phase 1 catalog schema;
  // seed only translation overrides for now.
  await upsertTranslation("provider", PROVIDER_ID, "en", "name", "Dr. Test Cardiologist");
  await upsertTranslation("provider", PROVIDER_ID, "ar", "name", "دکتر القلب التجريبي");
  await upsertTranslation("service", SERVICE_ID, "en", "name", "ECG");
  await upsertTranslation("service", SERVICE_ID, "ar", "name", "تخطيط القلب");
  await upsertTranslation("service_category", CATEGORY_ID, "en", "name", "Cardiology");
  await upsertTranslation("service_category", CATEGORY_ID, "ar", "name", "أمراض القلب");

  // Base catalog rows (catalog schema arrived in Phase 1 Task 1.1)
  await db.insert(serviceCategories).values({
    id: CATEGORY_ID, slug: "cardiology", name: "قلب و عروق",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "قلب و عروق" } });
  await db.insert(providers).values({
    id: PROVIDER_ID, kind: "person", name: "دکتر آزمایشی قلب", primaryLocationId: LOCATION_ID, phone: "02111111111",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر آزمایشی قلب" } });
  await db.insert(practitioners).values({
    providerId: PROVIDER_ID, specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق", credentials: "فوق تخصص قلب",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "متخصص قلب و عروق" } });
  await db.insert(locations).values({
    id: LOCATION_ID, providerId: PROVIDER_ID, label: "تهران مرکزی", addressLine: "تهران، خیابان ولیعصر", cityId: "1",
  }).onConflictDoUpdate({ target: locations.id, set: { label: "تهران مرکزی" } });
  await db.insert(services).values({
    id: SERVICE_ID, providerId: PROVIDER_ID, categoryId: CATEGORY_ID, serviceType: "diagnostic",
    locationId: LOCATION_ID, name: "نوار قلب", durationMinutes: 30, basePrice: "500000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "نوار قلب" } });
  await db.insert(diagnosticServices).values({
    serviceId: SERVICE_ID, prepInstructions: "ناشتا بودن به مدت ۸ ساعت", fastingHours: 8,
  }).onConflictDoNothing();
  const TEST_SLOT_ID = "slot-test-1";
  const tomorrow = new Date(Date.now() + 86400_000);
  const slotStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 18, 0));
  await db.insert(availabilitySlots).values({
    id: TEST_SLOT_ID, providerId: PROVIDER_ID, serviceId: SERVICE_ID,
    startsAt: slotStart, endsAt: new Date(slotStart.getTime() + 30 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();
  const slotStart2 = new Date(slotStart.getTime() + 60 * 60_000);
  await db.insert(availabilitySlots).values({
    id: "slot-test-2", providerId: PROVIDER_ID, serviceId: SERVICE_ID,
    startsAt: slotStart2, endsAt: new Date(slotStart2.getTime() + 30 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  // Home care fixture (Task 4.1 e2e): city 1/2 serviceable, slot tomorrow 20:00 UTC
  const HOME_CAT_ID = "cat-home";
  const HOME_PROVIDER_ID = "prov-home-1";
  const HOME_LOC_ID = "loc-home-1";
  const HOME_SERVICE_ID = "svc-home-1";
  await upsertTranslation("service_category", HOME_CAT_ID, "en", "name", "Home Care");
  await upsertTranslation("service", HOME_SERVICE_ID, "en", "name", "Home Care Nursing");
  await db.insert(serviceCategories).values({
    id: HOME_CAT_ID, slug: "home-care", name: "پرستاری در منزل",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "پرستاری در منزل" } });
  await db.insert(providers).values({
    id: HOME_PROVIDER_ID, kind: "person", name: "پرستار نمونه", phone: "02122222222",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "پرستار نمونه" } });
  await db.insert(locations).values({
    id: HOME_LOC_ID, providerId: HOME_PROVIDER_ID, label: "خانه", cityId: "1",
  }).onConflictDoUpdate({ target: locations.id, set: { label: "خانه" } });
  await db.insert(services).values({
    id: HOME_SERVICE_ID, providerId: HOME_PROVIDER_ID, categoryId: HOME_CAT_ID, serviceType: "home_care",
    locationId: null, name: "پرستاری در منزل", durationMinutes: 120, basePrice: "800000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "پرستاری در منزل" } });
  await db.insert(homeCareServices).values({
    serviceId: HOME_SERVICE_ID, requiresPatientAddress: true, serviceableCityIds: ["1", "2"],
  }).onConflictDoNothing();
  const homeSlotStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 20, 0));
  await db.insert(availabilitySlots).values({
    id: "slot-home-test-1", providerId: HOME_PROVIDER_ID, serviceId: HOME_SERVICE_ID,
    startsAt: homeSlotStart, endsAt: new Date(homeSlotStart.getTime() + 30 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  // Ambulance fixture (Task 4.3): scheduled non-emergency transport, slot tomorrow 21:00 UTC
  const AMB_SERVICE_ID = "svc-amb-1";
  await upsertTranslation("service", AMB_SERVICE_ID, "en", "name", "Non-emergency Ambulance");
  await db.insert(services).values({
    id: AMB_SERVICE_ID, providerId: HOME_PROVIDER_ID, categoryId: HOME_CAT_ID, serviceType: "ambulance",
    locationId: null, name: "آمبولانس غیر اورژانسی", durationMinutes: 30, basePrice: "1200000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "آمبولانس غیر اورژانسی" } });
  await db.insert(ambulanceServices).values({
    serviceId: AMB_SERVICE_ID, dispatchModel: null, vehicleType: "basic",
  }).onConflictDoNothing();
  const ambSlotStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 21, 0));
  await db.insert(availabilitySlots).values({
    id: "slot-amb-test-1", providerId: HOME_PROVIDER_ID, serviceId: AMB_SERVICE_ID,
    startsAt: ambSlotStart, endsAt: new Date(ambSlotStart.getTime() + 30 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  // Portal fixture (Task 4.5): distinct provider for the provider-portal e2e (Task 4.7); no slots (the e2e generates them via the portal)
  const PORTAL_PROVIDER_ID = "prov-portal-1";
  const PORTAL_LOC_ID = "loc-portal-1";
  const PORTAL_SERVICE_ID = "svc-provider-1";
  await db.insert(providers).values({
    id: PORTAL_PROVIDER_ID, kind: "person", name: "پرتال نمونه", phone: "09120000002",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "پرتال نمونه" } });
  await db.insert(practitioners).values({
    providerId: PORTAL_PROVIDER_ID, specialtyId: HOME_CAT_ID, bio: "پرتال نمونه",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "پرتال نمونه" } });
  await db.insert(locations).values({
    id: PORTAL_LOC_ID, providerId: PORTAL_PROVIDER_ID, label: "مطب نمونه", cityId: "1",
  }).onConflictDoUpdate({ target: locations.id, set: { label: "مطب نمونه" } });
  await db.insert(services).values({
    id: PORTAL_SERVICE_ID, providerId: PORTAL_PROVIDER_ID, categoryId: HOME_CAT_ID, serviceType: "therapy",
    locationId: PORTAL_LOC_ID, name: "ویزیت عمومی", durationMinutes: 30, basePrice: "300000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "ویزیت عمومی" } });
  await upsertTranslation("service", PORTAL_SERVICE_ID, "en", "name", "General Visit");

  console.log("seed complete");
}

main().then(() => process.exit(0));