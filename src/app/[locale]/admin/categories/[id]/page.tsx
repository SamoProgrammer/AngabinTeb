import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { serviceCategories, translations } from "@/db/schema";
import { updateCategory } from "@/contexts/catalog/actions";
import { CategoryForm } from "../category-form";

export default async function AdminCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string; locale?: string }>;
}) {
  const { id, locale } = await params;
  const tCategories = await getTranslations("admin.categories");

  const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
  if (!category) notFound();
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "service_category"), eq(translations.entityId, id)));

  const initial: Record<string, string> = { slug: category.slug, nameFa: category.name };
  for (const o of overrides) {
    if (o.field === "name" && (o.locale === "en" || o.locale === "ar")) initial[`name${o.locale === "en" ? "En" : "Ar"}`] = o.value;
  }

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tCategories("editTitle")}</h1>
      <CategoryForm action={updateCategory.bind(null, id)} initial={initial} locale={locale} />
    </div>
  );
}