import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/contexts/identity/actions";
import { saveFood } from "@/contexts/nutrition/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/clinical/pending-button";

export default async function AdminFoodNewPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  await requireAdmin();
  const { locale } = await params;
  const activeLocale = locale === "en" || locale === "ar" ? locale : "fa";
  const prefix = `/${activeLocale}`;

  const tCommon = await getTranslations("admin.common");
  const tFoods = await getTranslations("admin.foods");
  const tNav = await getTranslations("admin.nav");

  const newId = crypto.randomUUID();
  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[
          { label: tNav("dashboard"), href: `${prefix}/admin` },
          { label: tFoods("title"), href: `${prefix}/admin/foods` },
          { label: tCommon("create") },
        ]}
        title={tFoods("title")}
      />
      <form
        action={async (formData) => {
          "use server";
          const result = await saveFood(formData);
          if (result.ok) redirect(`${prefix}/admin/foods`);
        }}
        className="mt-6 grid max-w-md gap-3"
      >
        <input type="hidden" name="id" value={newId} />
        <Input name="name" required aria-label={tCommon("name")} />
        <Input name="category" required aria-label={tCommon("category")} />
        <PendingButton className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 cursor-pointer">
          {tCommon("create")}
        </PendingButton>
      </form>
    </div>
  );
}
