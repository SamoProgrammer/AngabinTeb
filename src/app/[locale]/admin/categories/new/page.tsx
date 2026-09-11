import { getTranslations } from "next-intl/server";
import { createCategory } from "@/contexts/catalog/actions";
import { CategoryForm } from "../category-form";

export default async function AdminCategoryNewPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const tCategories = await getTranslations("admin.categories");

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tCategories("newTitle")}</h1>
      <CategoryForm action={createCategory} locale={locale} />
    </div>
  );
}
