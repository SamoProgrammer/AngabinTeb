import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { createLocation } from "@/contexts/catalog/actions";
import { LocationForm } from "../location-form";

export default async function AdminLocationNewPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const tLocations = await getTranslations("admin.locations");

  const providerRows = await db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name);

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tLocations("newTitle")}</h1>
      <LocationForm action={createLocation} providers={providerRows} locale={locale} />
    </div>
  );
}
