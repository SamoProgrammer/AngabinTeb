import "dotenv/config";
import { db } from "../src/db";
import { users, translations } from "../src/db/schema";

const ADMIN_ID = "admin-seed";
const PROVIDER_ID = "prov-heart-1";
const CATEGORY_ID = "cat-cardio";
const SERVICE_ID = "svc-ecg-1";

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

  console.log("seed complete");
}

main().then(() => process.exit(0));