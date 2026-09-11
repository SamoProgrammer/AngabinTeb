import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers, serviceCategories, locations } from "@/db/schema";
import { createService } from "@/contexts/catalog/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ServiceForm } from "../service-form";

export default async function AdminServiceNewPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale ?? "fa";
  const tServices = await getTranslations("admin.services");
  const tNav = await getTranslations("admin.nav");

  const [providerRows, categoryRows, locationRows] = await Promise.all([
    db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name),
    db.select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).orderBy(serviceCategories.name),
    db.select({ id: locations.id, label: locations.label }).from(locations).orderBy(locations.label),
  ]);

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
