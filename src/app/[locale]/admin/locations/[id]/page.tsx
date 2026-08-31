import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { locations, providers, translations } from "@/db/schema";
import { createLocation, updateLocation } from "@/contexts/catalog/actions";
import { LocationForm } from "../location-form";

export default async function AdminLocationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const providerRows = await db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name);

  if (id === "new") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">New location</h1>
        <LocationForm action={createLocation} providers={providerRows} />
      </div>
    );
  }

  const [location] = await db.select().from(locations).where(eq(locations.id, id));
  if (!location) notFound();
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "location"), eq(translations.entityId, id)));

  const initial: Record<string, string> = {
    providerId: location.providerId,
    label: location.label,
    addressLine: location.addressLine ?? "",
    cityId: location.cityId,
    phone: location.phone ?? "",
  };
  for (const o of overrides) {
    if (o.field === "label" && (o.locale === "en" || o.locale === "ar")) initial[`label${o.locale === "en" ? "En" : "Ar"}`] = o.value;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit location</h1>
      <LocationForm action={updateLocation.bind(null, id)} initial={initial} providers={providerRows} />
    </div>
  );
}