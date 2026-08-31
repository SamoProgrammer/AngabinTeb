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
  const today = new Date();
  const slotStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 18, 0));
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

  console.log("seed complete");
}

main().then(() => process.exit(0));