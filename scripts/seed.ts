import "dotenv/config";
import { eq } from "drizzle-orm";
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

// Stitch Personas (design spec §5 — council codes live in credentials until a
// dedicated column lands; DoctorCard renders them via toPersianDigits)
const PROV_SADAT = "prov-sadat-1";
const PROV_RADMANESH = "prov-radmanesh-1";
const PROV_MAHDAVI = "prov-mahdavi-1";
const PROV_BAHRAMI = "prov-bahrami-1";
const CAT_ENDOCRINE = "cat-endocrine";
const CAT_NUTRITION = "cat-nutrition";
const CAT_GASTRO = "cat-gastro";

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
  // Stitch personas render via localizedRows("provider") — without these, en/ar
  // doctor pages fall back to Persian names.
  await upsertTranslation("provider", PROV_SADAT, "en", "name", "Dr. Leila Sadat");
  await upsertTranslation("provider", PROV_SADAT, "ar", "name", "الدكتورة ليلى سادات");
  await upsertTranslation("provider", PROV_RADMANESH, "en", "name", "Dr. Arash Radmanesh");
  await upsertTranslation("provider", PROV_RADMANESH, "ar", "name", "الدكتور آرش رادمنش");
  await upsertTranslation("provider", PROV_MAHDAVI, "en", "name", "Dr. Sara Mahdavi");
  await upsertTranslation("provider", PROV_MAHDAVI, "ar", "name", "الدكتورة سارا مهدوي");
  await upsertTranslation("provider", PROV_BAHRAMI, "en", "name", "Dr. Payam Bahrami");
  await upsertTranslation("provider", PROV_BAHRAMI, "ar", "name", "الدكتور بيام بهرامي");
  await upsertTranslation("service_category", CAT_ENDOCRINE, "en", "name", "Endocrinology & Metabolism");
  await upsertTranslation("service_category", CAT_ENDOCRINE, "ar", "name", "الغدد والاستقلاب");
  await upsertTranslation("service_category", CAT_NUTRITION, "en", "name", "Clinical Nutrition");
  await upsertTranslation("service_category", CAT_NUTRITION, "ar", "name", "التغذية السريرية");
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

  await db.insert(serviceCategories).values({
    id: CAT_GASTRO, slug: "gastro", name: "گوارش و کبد",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "گوارش و کبد" } });
  await upsertTranslation("service_category", CAT_GASTRO, "en", "name", "Gastroenterology");
  await upsertTranslation("service_category", CAT_GASTRO, "ar", "name", "الجهاز الهضمي والكبد");

  // Base providers first (locations reference providers; primaryLocationId linked after)
  await db.insert(providers).values({
    id: PROVIDER_ID, kind: "person", name: "دکتر آزمایشی قلب", phone: "02111111111",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر آزمایشی قلب" } });

  // Base location
  await db.insert(locations).values({
    id: LOCATION_ID, providerId: PROVIDER_ID, label: "تهران مرکزی", addressLine: "تهران، خیابان ولیعصر، نرسیده به میدان ونک", cityId: "1",
  }).onConflictDoUpdate({ target: locations.id, set: { label: "تهران مرکزی" } });

  await db.update(providers).set({ primaryLocationId: LOCATION_ID }).where(eq(providers.id, PROVIDER_ID));

  await db.insert(practitioners).values({
    providerId: PROVIDER_ID, specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق و اکوکاردیوگرافی", credentials: "بورد تخصصی قلب و عروق",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { bio: "متخصص قلب و عروق و اکوکاردیوگرافی" } });

  // Stitch Persona: Dr. Leila Sadat — Endocrinologist (council 11245)
  await db.insert(providers).values({
    id: PROV_SADAT, kind: "person", name: "دکتر لیلا سادات", primaryLocationId: LOCATION_ID, phone: "02188884567",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر لیلا سادات" } });

  await db.insert(practitioners).values({
    providerId: PROV_SADAT, specialtyId: CAT_ENDOCRINE, bio: "فوق‌تخصص غدد، متابولیسم و دیابت و عضو هیئت علمی", credentials: "نظام پزشکی: 11245 · فوق تخصص غدد و متابولیسم",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { specialtyId: CAT_ENDOCRINE, bio: "فوق‌تخصص غدد، متابولیسم و دیابت و عضو هیئت علمی", credentials: "نظام پزشکی: 11245 · فوق تخصص غدد و متابولیسم" } });

  // Stitch Persona: Dr. Arash Radmanesh — Clinical Nutritionist (council 24890)
  await db.insert(providers).values({
    id: PROV_RADMANESH, kind: "person", name: "دکتر آرش رادمنش", primaryLocationId: LOCATION_ID, phone: "02188884568",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر آرش رادمنش" } });

  await db.insert(practitioners).values({
    providerId: PROV_RADMANESH, specialtyId: CAT_NUTRITION, bio: "فلوشیپ تغذیه بالینی و چاقی؛ مشاوره رژیم‌درمانی بومی ایرانی", credentials: "نظام پزشکی: 24890 · فلوشیپ تغذیه بالینی و چاقی",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { specialtyId: CAT_NUTRITION, bio: "فلوشیپ تغذیه بالینی و چاقی؛ مشاوره رژیم‌درمانی بومی ایرانی", credentials: "نظام پزشکی: 24890 · فلوشیپ تغذیه بالینی و چاقی" } });

  // Non-spec persona removed (pre-launch): Dr. Farhad Moradi is not in the
  // design spec §5. Deleting here keeps reseeds convergent on dev databases.
  await db.delete(practitioners).where(eq(practitioners.providerId, "prov-moradi-1"));
  await db.delete(providers).where(eq(providers.id, "prov-moradi-1"));

  // Stitch Persona: Dr. Sara Mahdavi — Cardiologist (council 31567)
  await db.insert(providers).values({
    id: PROV_MAHDAVI, kind: "person", name: "دکتر سارا مهدوی", primaryLocationId: LOCATION_ID, phone: "02188884570",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر سارا مهدوی" } });

  await db.insert(practitioners).values({
    providerId: PROV_MAHDAVI, specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق و اکوکاردیوگرافی داپلر", credentials: "نظام پزشکی: 31567 · بورد تخصصی قلب و عروق",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { specialtyId: CATEGORY_ID, bio: "متخصص قلب و عروق و اکوکاردیوگرافی داپلر", credentials: "نظام پزشکی: 31567 · بورد تخصصی قلب و عروق" } });

  // Stitch Persona: Dr. Payam Bahrami — Gastroenterologist (council 18764)
  await db.insert(providers).values({
    id: PROV_BAHRAMI, kind: "person", name: "دکتر پیام بهرامی", primaryLocationId: LOCATION_ID, phone: "02188884571",
  }).onConflictDoUpdate({ target: providers.id, set: { name: "دکتر پیام بهرامی" } });

  await db.insert(practitioners).values({
    providerId: PROV_BAHRAMI, specialtyId: CAT_GASTRO, bio: "فوق‌تخصص گوارش و کبد؛ آندوسکوپی و مدیریت کبد چرب", credentials: "نظام پزشکی: 18764 · فوق تخصص گوارش و کبد",
  }).onConflictDoUpdate({ target: practitioners.providerId, set: { specialtyId: CAT_GASTRO, bio: "فوق‌تخصص گوارش و کبد؛ آندوسکوپی و مدیریت کبد چرب", credentials: "نظام پزشکی: 18764 · فوق تخصص گوارش و کبد" } });

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

  // Persona services: practitioners without services render doctor profiles with
  // no bookable service and leave the catalog thin. Plain service_type rows per
  // manager vision (consultation — no satellite needed).
  const SVC_NUTRITION = "svc-nutrition-consult";
  await db.insert(services).values({
    id: SVC_NUTRITION, providerId: PROV_RADMANESH, categoryId: CAT_NUTRITION, serviceType: "consultation",
    locationId: LOCATION_ID, name: "مشاوره تغذیه و رژیم‌درمانی", durationMinutes: 45, basePrice: "3500000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "مشاوره تغذیه و رژیم‌درمانی" } });
  await upsertTranslation("service", SVC_NUTRITION, "en", "name", "Clinical Nutrition Consultation");
  await upsertTranslation("service", SVC_NUTRITION, "ar", "name", "استشارة التغذية السريرية");

  const SVC_CARDIO_CONSULT = "svc-cardio-consult";
  await db.insert(services).values({
    id: SVC_CARDIO_CONSULT, providerId: PROV_MAHDAVI, categoryId: CATEGORY_ID, serviceType: "consultation",
    locationId: LOCATION_ID, name: "ویزیت تخصصی قلب و عروق", durationMinutes: 30, basePrice: "4500000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "ویزیت تخصصی قلب و عروق" } });
  await upsertTranslation("service", SVC_CARDIO_CONSULT, "en", "name", "Cardiology Consultation");
  await upsertTranslation("service", SVC_CARDIO_CONSULT, "ar", "name", "استشارة أمراض القلب");

  const SVC_GASTRO_CONSULT = "svc-gastro-consult";
  await db.insert(services).values({
    id: SVC_GASTRO_CONSULT, providerId: PROV_BAHRAMI, categoryId: CAT_GASTRO, serviceType: "consultation",
    locationId: LOCATION_ID, name: "ویزیت فوق‌تخصصی گوارش و کبد", durationMinutes: 30, basePrice: "4500000",
  }).onConflictDoUpdate({ target: services.id, set: { name: "ویزیت فوق‌تخصصی گوارش و کبد" } });
  await upsertTranslation("service", SVC_GASTRO_CONSULT, "en", "name", "Gastroenterology Consultation");
  await upsertTranslation("service", SVC_GASTRO_CONSULT, "ar", "name", "استشارة الجهاز الهضمي والكبد");

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

  await db.insert(availabilitySlots).values({
    id: "slot-radmanesh-1", providerId: PROV_RADMANESH, serviceId: SVC_NUTRITION,
    startsAt: new Date(slotStart.getTime() + 240 * 60_000), endsAt: new Date(slotStart.getTime() + 285 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  await db.insert(availabilitySlots).values({
    id: "slot-mahdavi-1", providerId: PROV_MAHDAVI, serviceId: SVC_CARDIO_CONSULT,
    startsAt: new Date(slotStart.getTime() + 300 * 60_000), endsAt: new Date(slotStart.getTime() + 330 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  await db.insert(availabilitySlots).values({
    id: "slot-bahrami-1", providerId: PROV_BAHRAMI, serviceId: SVC_GASTRO_CONSULT,
    startsAt: new Date(slotStart.getTime() + 360 * 60_000), endsAt: new Date(slotStart.getTime() + 390 * 60_000),
    capacity: 1,
  }).onConflictDoNothing();

  console.log("seed complete with Stitch personas");
}

main().then(() => process.exit(0));