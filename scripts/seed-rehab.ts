import "dotenv/config";
import { db } from "../src/db";
import {
  translations,
  serviceCategories,
  providers,
  practitioners,
  locations,
  services,
  availabilitySlots,
} from "../src/db/schema";

const CATEGORY_ID = "cat-rehab";

const PROVIDERS: Array<{ id: string; name: string; phone: string; locationId: string }> = [
  { id: "prov-rehab-1", name: "فیزیوتراپیست نمونه", phone: "02133333333", locationId: "loc-rehab-1" },
  { id: "prov-rehab-2", name: "کاردرمانگر نمونه", phone: "02144444444", locationId: "loc-rehab-2" },
];

const SERVICES: Array<{
  id: string; name: string; enName: string; providerId: string; locationId: string;
}> = [
  { id: "svc-rehab-1", name: "فیزیوتراپی", enName: "Physiotherapy", providerId: "prov-rehab-1", locationId: "loc-rehab-1" },
  { id: "svc-rehab-2", name: "کاردرمانی", enName: "Occupational Therapy", providerId: "prov-rehab-1", locationId: "loc-rehab-1" },
  { id: "svc-rehab-3", name: "گفتاردرمانی", enName: "Speech Therapy", providerId: "prov-rehab-2", locationId: "loc-rehab-2" },
  { id: "svc-rehab-4", name: "ماساژ درمانی", enName: "Therapeutic Massage", providerId: "prov-rehab-2", locationId: "loc-rehab-2" },
];

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
  await upsertTranslation("service_category", CATEGORY_ID, "en", "name", "Rehabilitation");

  await db.insert(serviceCategories).values({
    id: CATEGORY_ID, slug: "rehab", name: "توانبخشی",
  }).onConflictDoUpdate({ target: serviceCategories.id, set: { name: "توانبخشی" } });

  for (const p of PROVIDERS) {
    await db.insert(providers).values({
      id: p.id, kind: "person", name: p.name, primaryLocationId: p.locationId, phone: p.phone,
    }).onConflictDoUpdate({ target: providers.id, set: { name: p.name } });
    await db.insert(practitioners).values({
      providerId: p.id, specialtyId: CATEGORY_ID, bio: p.id === "prov-rehab-1" ? "فیزیوتراپیست دارای پروانه رسمی" : "کاردرمانگر دارای پروانه رسمی",
    }).onConflictDoUpdate({ target: practitioners.providerId, set: { specialtyId: CATEGORY_ID } });
    await db.insert(locations).values({
      id: p.locationId, providerId: p.id, label: "کلینیک توانبخشی", cityId: "1",
    }).onConflictDoUpdate({ target: locations.id, set: { providerId: p.id } });
  }

  for (const s of SERVICES) {
    await upsertTranslation("service", s.id, "en", "name", s.enName);
    await db.insert(services).values({
      id: s.id, providerId: s.providerId, categoryId: CATEGORY_ID, serviceType: "rehab",
      locationId: s.locationId, name: s.name, durationMinutes: 45, basePrice: "700000",
    }).onConflictDoUpdate({ target: services.id, set: { name: s.name } });
  }

  const tomorrow = new Date(Date.now() + 86400_000);
  const SLOTS: Array<{ id: string; serviceId: string; hour: number; minute: number }> = [
    { id: "slot-rehab-1", serviceId: "svc-rehab-1", hour: 17, minute: 0 },
    { id: "slot-rehab-2", serviceId: "svc-rehab-2", hour: 17, minute: 30 },
  ];
  for (const slot of SLOTS) {
    const startsAt = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), slot.hour, slot.minute));
    await db.insert(availabilitySlots).values({
      id: slot.id, providerId: SERVICES.find((s) => s.id === slot.serviceId)!.providerId,
      serviceId: slot.serviceId, startsAt, endsAt: new Date(startsAt.getTime() + 45 * 60_000), capacity: 1,
    }).onConflictDoNothing();
  }

  console.log(`seeded ${SERVICES.length} rehab services`);
}

main().then(() => process.exit(0));
