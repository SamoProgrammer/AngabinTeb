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

// Stitch Personas
const PROV_SADAT = "prov-sadat-1";
const PROV_RADMANESH = "prov-radmanesh-1";
const PROV_MORADI = "prov-moradi-1";
const CAT_ENDOCRINE = "cat-endocrine";
const CAT_NUTRITION = "cat-nutrition";

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

  // Translation overrides
  await upsertTranslation("provider", PROVIDER_ID, "en", "name", "Dr. Test Cardiologist");
  await upsertTranslation("provider", PROVIDER_ID, "ar", "name", "دکتر القلب التجريبي");
  await upsertTranslation("service", SERVICE_ID, "en", "name", "ECG");
  await upsertTranslation("service", SERVICE_ID, "ar", "name", "تخطيط القلب");
  await upsertTranslation("service_category", CATEGORY_ID, "en", "name", "Cardiology");
  await upsertTranslation("service_category", CATEGORY_ID, "ar", "name", "أمراض القلب");

  // Base catalog categories
  await db.insert(serviceCategories).values({
    id: CATEGORY_ID, slug: "cardiology", name: "قلب و عروق",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "قلب و عروق" } });

  await db.insert(serviceCategories).values({
    id: CAT_ENDOCRINE, slug: "endocrine", name: "غدد و متابولیسم",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "غدد و متابولیسم" } });

  await db.insert(serviceCategories).values({
    id: CAT_NUTRITION, slug: "nutrition", name: "تغذیه بالینی",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "تغذیه بالینی" } });

  // Base location
  await db.insert(locations).values({
    id: LOCATION_ID, providerId: PROVIDER_ID, label: "تهران مرکزی", addressLine: "تهران، خیابان ولیعصر، نرسیده به میدان ونک", cityId: "1",
  }).onConflictDoUpdate({ target: locations.id, set: { label: "تهران مرکزی" } });

  // Base providers
  await db.insert(providers).values({
    id: PROVIDER_ID, kind: "person", name: "دکتر آزمایشی قلب", primaryLocationId: LOCATION_ID, phone: "02111111111",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر آزمایشی قلب" } });

  await db.insert(practitioners).values({
    providerId: PROVIDER_ID, specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق و اکوکاردیوگرافی", credentials: "بورد تخصصی قلب و عروق",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "متخصص قلب و عروق و اکوکاردیوگرافی" } });

  // Stitch Persona: Dr. Leila Sadat
  await db.insert(providers).values({
    id: PROV_SADAT, kind: "person", name: "دکتر لیلا سادات", primaryLocationId: LOCATION_ID, phone: "02188884567",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر لیلا سادات" } });

  await db.insert(practitioners).values({
    providerId: PROV_SADAT, specialtyId: CAT_ENDOCRINE, bio: "فوق‌تخصص غدد، متابولیسم و دیابت و عضو هیئت علمی", credentials: "فوق تخصص غدد و متابولیسم",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "فوق‌تخصص غدد، متابولیسم و دیابت و عضو هیئت علمی" } });

  // Stitch Persona: Dr. Arash Radmanesh
  await db.insert(providers).values({
    id: PROV_RADMANESH, kind: "person", name: "دکتر آرش رادمنش", primaryLocationId: LOCATION_ID, phone: "02188884568",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر آرش رادمنش" } });

  await db.insert(practitioners).values({
    providerId: PROV_RADMANESH, specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق و پایش ریسک آترواسکلروزیس", credentials: "بورد تخصصی قلب و عروق",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "متخصص قلب و عروق و پایش ریسک آترواسکلروزیس" } });

  // Stitch Persona: Dr. Farhad Moradi
  await db.insert(providers).values({
    id: PROV_MORADI, kind: "person", name: "دکتر فرهاد مرادی", primaryLocationId: LOCATION_ID, phone: "02188884569",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر فرهاد مرادی" } });

  await db.insert(practitioners).values({
    providerId: PROV_MORADI, specialtyId: CAT_NUTRITION, bio: "دکترای تخصصی علوم تغذیه و رژیم‌درمانی بالینی", credentials: "دکترای تخصصی رژیم‌درمانی",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "دکترای تخصصی علوم تغذیه و رژیم‌درمانی بالینی" } });

  // Services
  await db.insert(services).values({
    id: SERVICE_ID, providerId: PROVIDER_ID, categoryId: CATEGORY_ID, serviceType: "diagnostic",
    locationId: LOCATION_ID, name: "نوار قلب", durationMinutes: 30, basePrice: "500000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "نوار قلب" } });

  await db.insert(diagnosticServices).values({
    serviceId: SERVICE_ID, prepInstructions: "ناشتا بودن به مدت ۸ ساعت", fastingHours: 8,
  }).onConflictDoNothing();

  const SVC_ENDOCRINE = "svc-endocrine-consult";
  await db.insert(services).values({
    id: SVC_ENDOCRINE, providerId: PROV_SADAT, categoryId: CAT_ENDOCRINE, serviceType: "consultation",
    locationId: LOCATION_ID, name: "ویزیت تخصصی غدد و دیابت", durationMinutes: 30, basePrice: "4500000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "ویزیت تخصصی غدد و دیابت" } });

  const SVC_METABOLIC = "svc-metabolic-panel";
  await db.insert(services).values({
    id: SVC_METABOLIC, providerId: PROV_SADAT, categoryId: CAT_ENDOCRINE, serviceType: "diagnostic",
    locationId: LOCATION_ID, name: "چکاپ متابولیک و قند سه ماهه HbA1c", durationMinutes: 20, basePrice: "3800000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "چکاپ متابولیک و قند سه ماهه HbA1c" } });

  await db.insert(diagnosticServices).values({
    serviceId: SVC_METABOLIC, prepInstructions: "۱۰ الی ۱۲ ساعت ناشتایی پیش از مراجعه", fastingHours: 12,
  }).onConflictDoNothing();

  // Availability Slots for tomorrow
  const tomorrow = new Date(Date.now() + 86400_000);
  const slotStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 14, 0));

  await db.insert(availabilitySlots).values({
    id: "slot-test-1", providerId: PROVIDER_ID, serviceId: SERVICE_ID,
    startsAt: slotStart, endsAt: new Date(slotStart.getTime() + 30 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  await db.insert(availabilitySlots).values({
    id: "slot-test-2", providerId: PROVIDER_ID, serviceId: SERVICE_ID,
    startsAt: new Date(slotStart.getTime() + 60 * 60_000), endsAt: new Date(slotStart.getTime() + 90 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  await db.insert(availabilitySlots).values({
    id: "slot-sadat-1", providerId: PROV_SADAT, serviceId: SVC_ENDOCRINE,
    startsAt: new Date(slotStart.getTime() + 120 * 60_000), endsAt: new Date(slotStart.getTime() + 150 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  await db.insert(availabilitySlots).values({
    id: "slot-sadat-2", providerId: PROV_SADAT, serviceId: SVC_METABOLIC,
    startsAt: new Date(slotStart.getTime() + 180 * 60_000), endsAt: new Date(slotStart.getTime() + 200 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  console.log("seed complete with Stitch personas");
}

main().then(() => process.exit(0));