import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { serviceCategories } from "@/db/schema";
import { createProvider } from "@/contexts/catalog/actions";
import { ProviderForm } from "../provider-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminProviderNewPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale ?? "fa";
  const tProviders = await getTranslations("admin.providers");
  const tNav = await getTranslations("admin.nav");

  const specialties = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .orderBy(serviceCategories.name);
  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[
          { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
          { label: tProviders("title"), href: `/${activeLocale}/admin/providers` },
          { label: tProviders("newTitle") },
        ]}
        title={tProviders("newTitle")}
      />
      <ProviderForm action={createProvider} specialties={specialties} locale={locale} />
    </div>
  );
}
