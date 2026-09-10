import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { services, providers, serviceCategories, locations, diagnosticServices, translations } from "@/db/schema";
import { createService, updateService } from "@/contexts/catalog/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ServiceForm } from "../service-form";

export default async function AdminServiceEditPage({
  params,
}: {
  params: Promise<{ id: string; locale?: string }>;
}) {
  const { id, locale } = await params;
  const activeLocale = locale ?? "fa";
  const tServices = await getTranslations("admin.services");
  const tNav = await getTranslations("admin.nav");

  const [providerRows, categoryRows, locationRows] = await Promise.all([
    db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name),
    db.select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).orderBy(serviceCategories.name),
    db.select({ id: locations.id, label: locations.label }).from(locations).orderBy(locations.label),
  ]);

  if (id === "new") {
    return (
      <div className="text-start">
        <AdminPageHeader
          crumbs={[
            { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
            { label: tServices("title"), href: `/${activeLocale}/admin/services` },
            { label: tServices("newTitle") },
          ]}
          title={tServices("newTitle")}
        />
        <ServiceForm
          action={createService}
          providers={providerRows}
          categories={categoryRows}
          locations={locationRows}
          locale={locale}
        />
      </div>
    );
  }

  const [service] = await db.select().from(services).where(eq(services.id, id));
  if (!service) notFound();
  const [diagnostic] = await db.select().from(diagnosticServices).where(eq(diagnosticServices.serviceId, id));
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "service"), eq(translations.entityId, id)));

  const initial: Record<string, string> = {
    providerId: service.providerId,
    categoryId: service.categoryId,
    serviceType: service.serviceType,
    locationId: service.locationId ?? "",
    nameFa: service.name,
    durationMinutes: String(service.durationMinutes),
    basePrice: String(service.basePrice),
    prepInstructionsFa: diagnostic?.prepInstructions ?? "",
    fastingHours: diagnostic?.fastingHours != null ? String(diagnostic.fastingHours) : "",
  };
  for (const o of overrides) {
    if (o.field === "name" && (o.locale === "en" || o.locale === "ar")) initial[`name${o.locale === "en" ? "En" : "Ar"}`] = o.value;
  }

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[
          { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
          { label: tServices("title"), href: `/${activeLocale}/admin/services` },
          { label: tServices("editTitle") },
        ]}
        title={tServices("editTitle")}
      />
      <ServiceForm
        action={updateService.bind(null, id)}
        initial={initial}
        providers={providerRows}
        categories={categoryRows}
        locations={locationRows}
        locale={locale}
      />
    </div>
  );
}