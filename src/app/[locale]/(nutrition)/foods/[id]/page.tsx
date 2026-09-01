import { notFound } from "next/navigation";
import { getFoodDetail } from "@/contexts/nutrition/queries";
import { LogFood } from "@/components/nutrition/log-food";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const food = await getFoodDetail(id, locale);
  if (!food) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">{food.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{food.category}</p>
      <h2 className="mt-6 text-lg font-semibold">Serving units</h2>
      <ul className="mt-2 divide-y">
        {food.servingUnits.map((su) => (
          <li key={su.id} className="py-2">
            <span className="font-medium">{su.name}</span>
            <span className="text-gray-500"> — {su.gramsEquivalent} g</span>
          </li>
        ))}
        {food.servingUnits.length === 0 && <li className="py-2 text-gray-500">No serving units defined.</li>}
      </ul>
      <h2 className="mt-6 text-lg font-semibold">Nutrients per 100 g</h2>
      <table className="mt-2 w-full text-left">
        <thead>
          <tr className="border-b text-sm text-gray-500">
            <th className="py-2">Nutrient</th>
            <th className="py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {food.nutrients.map((n) => (
            <tr key={n.nutrientId} className="border-b">
              <td className="py-2">{n.name} ({n.unit})</td>
              <td className="py-2">{n.amountPer100g}</td>
            </tr>
          ))}
          {food.nutrients.length === 0 && (
            <tr><td className="py-2 text-gray-500" colSpan={2}>No nutrient data available.</td></tr>
          )}
        </tbody>
      </table>
      <LogFood
        foods={[{
          id: food.id,
          name: food.name,
          servingUnits: food.servingUnits.map((su) => ({ id: su.id, name: su.name })),
        }]}
      />
    </div>
  );
}