import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/contexts/identity/actions";
import { getFoodAdmin } from "@/contexts/nutrition/queries";
import { saveFood, saveServingUnit, saveFoodNutrient } from "@/contexts/nutrition/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/clinical/pending-button";

export default async function AdminFoodPage({
  params,
}: {
  params: Promise<{ id: string; locale?: string }>;
}) {
  await requireAdmin();
  const { id, locale } = await params;
  const activeLocale = locale === "en" || locale === "ar" ? locale : "fa";
  const prefix = `/${activeLocale}`;

  const tCommon = await getTranslations("admin.common");
  const tFoods = await getTranslations("admin.foods");
  const tNav = await getTranslations("admin.nav");

  const food = await getFoodAdmin(id);
  if (!food) notFound();

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[
          { label: tNav("dashboard"), href: `${prefix}/admin` },
          { label: tFoods("title"), href: `${prefix}/admin/foods` },
          { label: food.name },
        ]}
        title={food.name}
      />
      <form action={async (formData) => { "use server"; await saveFood(formData); }} className="mt-6 grid max-w-md gap-3">
        <input type="hidden" name="id" value={food.id} />
        <Input name="name" defaultValue={food.name} required aria-label={tCommon("name")} />
        <Input name="category" defaultValue={food.category} required aria-label={tCommon("category")} />
        <PendingButton className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 cursor-pointer">
          {tCommon("save")}
        </PendingButton>
      </form>

      <h2 className="mt-8 text-lg font-semibold">{tFoods("servingUnits")}</h2>
      <ul className="mt-2 divide-y">
        {food.servingUnits.map((su) => (
          <li key={su.id} className="flex items-center gap-4 py-2">
            <span className="font-medium">{su.name}</span>
              <form action={async (formData) => { "use server"; await saveServingUnit(formData); }} className="flex items-center gap-2">
              <input type="hidden" name="id" value={su.id} />
              <input type="hidden" name="foodId" value={food.id} />
              <Input name="name" defaultValue={su.name} className="w-40" aria-label={tCommon("name")} />
              <Input name="gramsEquivalent" defaultValue={su.gramsEquivalent} className="w-24" aria-label={tFoods("gramsEquivalent")} />
              <PendingButton className="rounded-lg border px-3 py-1 text-sm font-medium hover:bg-surface-container cursor-pointer">
                {tCommon("save")}
              </PendingButton>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold">{tFoods("nutrientsTitle")}</h2>
      <form action={async (formData) => { "use server"; await saveFoodNutrient(formData); }} className="mt-2 grid max-w-md gap-2">
        <input type="hidden" name="foodId" value={food.id} />
        {food.nutrients.map((n) => (
          <label key={n.nutrientId} className="flex items-center gap-2">
            <span className="w-40 text-sm">{n.name} ({n.unit})</span>
            <Input name={`amount-${n.nutrientId}`} defaultValue={n.amountPer100g} aria-label={n.name} />
          </label>
        ))}
        <PendingButton className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 cursor-pointer">
          {tFoods("saveNutrients")}
        </PendingButton>
      </form>
    </div>
  );
}
