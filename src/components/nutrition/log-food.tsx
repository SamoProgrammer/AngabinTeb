"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logIntake } from "@/contexts/nutrition/actions";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface FoodOption {
  id: string;
  name: string;
  servingUnits: Array<{ id: string; name: string }>;
}

export function LogFood({ foods }: { foods: FoodOption[] }) {
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [servingUnitId, setServingUnitId] = useState(
    foods[0]?.servingUnits[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const food = foods.find((f) => f.id === foodId);

  function onFoodChange(id: string) {
    setFoodId(id);
    const selected = foods.find((f) => f.id === id);
    setServingUnitId(selected?.servingUnits[0]?.id ?? "");
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/20">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ClinicalIcon name="add_circle" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            ثبت سریع وعده در پرونده
          </h2>
          <p className="text-xs text-on-surface-variant">
            محاسبه آنی کالری و درشت‌مغذی‌ها با مقیاس‌های خانگی
          </p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 gap-4 text-right"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setSuccess(false);
          startTransition(async () => {
            const res = await logIntake({
              foodId,
              servingUnitId,
              quantity: Number(quantity),
            });
            if (res.ok) {
              setSuccess(true);
              router.refresh();
              setTimeout(() => setSuccess(false), 3000);
            } else {
              setError("Failed to log intake");
            }
          });
        }}
      >
        {/* Food Select (Preserves Playwright getByLabel('Food')) */}
        <div>
          <label
            htmlFor="food-select"
            className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
          >
            خوراک / غذا <span className="text-on-surface-variant font-normal text-xs">(Food)</span>
          </label>
          <select
            id="food-select"
            aria-label="Food"
            value={foodId}
            onChange={(e) => onFoodChange(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
          >
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Serving Unit Select (Preserves Playwright getByLabel('Serving')) */}
        <div>
          <label
            htmlFor="serving-select"
            className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
          >
            واحد مصرفی سنتی <span className="text-on-surface-variant font-normal text-xs">(Serving)</span>
          </label>
          <select
            id="serving-select"
            aria-label="Serving"
            value={servingUnitId}
            onChange={(e) => setServingUnitId(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
          >
            {food?.servingUnits.map((su) => (
              <option key={su.id} value={su.id}>
                {su.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Input (Preserves Playwright getByLabel('Quantity')) */}
        <div>
          <label
            htmlFor="qty-input"
            className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
          >
            مقدار مصرف <span className="text-on-surface-variant font-normal text-xs">(Quantity)</span>
          </label>
          <input
            id="qty-input"
            aria-label="Quantity"
            type="number"
            step="0.5"
            min="0.5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30 text-start"
          />
        </div>

        {error && (
          <p role="alert" className="text-error text-xs font-bold mt-1">
            {error}
          </p>
        )}

        {success && (
          <div className="flex items-center gap-1.5 text-primary text-xs font-bold mt-1">
            <ClinicalIcon name="check_circle" size={16} />
            <span>با موفقیت در پرونده سلامت ثبت شد.</span>
          </div>
        )}

        {/* Submit button (Preserves Playwright getByRole('button', { name: 'Log intake' })) */}
        <button
          type="submit"
          disabled={pending}
          aria-label="Log intake"
          className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          <ClinicalIcon
            name={pending ? "sync" : "add_circle"}
            size={20}
            className={pending ? "animate-spin" : ""}
          />
          <span>{pending ? "در حال ثبت... (Logging…)" : "ثبت در پرونده (Log intake)"}</span>
        </button>
      </form>
    </div>
  );
}