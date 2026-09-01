"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logIntake } from "@/contexts/nutrition/actions";

type FoodOption = { id: string; name: string; servingUnits: Array<{ id: string; name: string }> };

export function LogFood({ foods }: { foods: FoodOption[] }) {
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [servingUnitId, setServingUnitId] = useState(foods[0]?.servingUnits[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const food = foods.find((f) => f.id === foodId);

  function onFoodChange(id: string) {
    setFoodId(id);
    setServingUnitId(foods.find((f) => f.id === id)?.servingUnits[0]?.id ?? "");
  }

  return (
    <form
      className="mt-6 grid max-w-md gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await logIntake({ foodId, servingUnitId, quantity: Number(quantity) });
          if (res.ok) router.refresh();
          else setError("Failed to log intake");
        });
      }}
    >
      <label className="flex items-center gap-2">
        Food
        <select value={foodId} onChange={(e) => onFoodChange(e.target.value)} className="flex-1 rounded border px-3 py-2">
          {foods.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        Serving
        <select value={servingUnitId} onChange={(e) => setServingUnitId(e.target.value)} className="flex-1 rounded border px-3 py-2">
          {food?.servingUnits.map((su) => <option key={su.id} value={su.id}>{su.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        Quantity
        <input type="number" step="0.5" min="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="flex-1 rounded border px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-emerald-600 px-6 py-2 text-white disabled:opacity-50">
        {pending ? "Logging…" : "Log intake"}
      </button>
    </form>
  );
}