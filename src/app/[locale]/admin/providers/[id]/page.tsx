import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers, practitioners, serviceCategories, translations } from "@/db/schema";
import { createProvider, updateProvider } from "@/contexts/catalog/actions";
import { ProviderForm } from "../provider-form";

export default async function AdminProviderEditPage({
  params,
}: {
  params: Promise<{ id: string; locale?: string }>;
}) {
  const { id, locale } = await params;
  const tProviders = await getTranslations("admin.providers");

  const specialties = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .orderBy(serviceCategories.name);

  if (id === "new") {
    return (
      <div className="text-start">
        <h1 className="mb-6 text-2xl font-bold">{tProviders("newTitle")}</h1>
        <ProviderForm action={createProvider} specialties={specialties} locale={locale} />
      </div>
    );
  }

  const [provider] = await db.select().from(providers).where(eq(providers.id, id));
  if (!provider) notFound();
  const [practitioner] = await db.select().from(practitioners).where(eq(practitioners.providerId, id));
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "provider"), eq(translations.entityId, id)));

  const initial: Record<string, string> = {
    kind: provider.kind,
    orgType: provider.orgType ?? "",
    nameFa: provider.name,
    phone: provider.phone ?? "",
    specialtyId: practitioner?.specialtyId ?? "",
    bioFa: practitioner?.bio ?? "",
  };
  for (const o of overrides) {
    if (o.field === "name" && (o.locale === "en" || o.locale === "ar")) initial[`name${o.locale === "en" ? "En" : "Ar"}`] = o.value;
  }

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tProviders("editTitle")}</h1>
      <ProviderForm
        action={updateProvider.bind(null, id)}
        initial={initial}
        specialties={specialties}
        locale={locale}
      />
    </div>
  );
}