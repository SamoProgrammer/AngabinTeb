import { notFound } from "next/navigation";
import { requireAdmin } from "@/contexts/identity/actions";
import { getFoodAdmin } from "@/contexts/nutrition/queries";
import { saveFood, saveServingUnit, saveFoodNutrient } from "@/contexts/nutrition/actions";
import { Input } from "@/components/ui/input";

export default async function AdminFoodPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const food = await getFoodAdmin(id);
  if (!food) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">{food.name}</h1>
      <form action={async (formData) => { await saveFood(formData); }} className="mt-6 grid max-w-md gap-3">
        <input type="hidden" name="id" value={food.id} />
        <Input name="name" defaultValue={food.name} required aria-label="Name" />
        <Input name="category" defaultValue={food.category} required aria-label="Category" />
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Save</button>
      </form>
      <h2 className="mt-8 text-lg font-semibold">Serving units</h2>
      <ul className="mt-2 divide-y">
        {food.servingUnits.map((su) => (
          <li key={su.id} className="flex items-center gap-4 py-2">
            <span>{su.name}</span>
            <form action={async (formData) => { await saveServingUnit(formData); }} className="flex items-center gap-2">
              <input type="hidden" name="id" value={su.id} />
              <input type="hidden" name="foodId" value={food.id} />
              <Input name="name" defaultValue={su.name} className="w-40" aria-label="Serving unit name" />
              <Input name="gramsEquivalent" defaultValue={su.gramsEquivalent} className="w-24" aria-label="Grams equivalent" />
              <button type="submit" className="rounded border px-3 py-1">Save</button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-lg font-semibold">Nutrients (per 100 g)</h2>
      <form action={async (formData) => { await saveFoodNutrient(formData); }} className="mt-2 grid max-w-md gap-2">
        <input type="hidden" name="foodId" value={food.id} />
        {food.nutrients.map((n) => (
          <label key={n.nutrientId} className="flex items-center gap-2">
            <span className="w-40">{n.name} ({n.unit})</span>
            <Input name={`amount-${n.nutrientId}`} defaultValue={n.amountPer100g} aria-label={n.name} />
          </label>
        ))}
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Save nutrients</button>
      </form>
    </div>
  );
}