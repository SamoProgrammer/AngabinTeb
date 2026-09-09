"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logIntake } from "@/contexts/nutrition/actions";
import { useActionFeedback } from "@/components/clinical/use-action-feedback";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import { tehranTodayIso } from "@/lib/jalali";
import { useTranslations } from "next-intl";
import { CircleCheckBig, CirclePlus, RefreshCw, Search } from "lucide-react";

export interface FoodOption {
  id: string;
  name: string;
  servingUnits: Array<{ id: string; name: string }>;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

function defaultMealSlot(hour = new Date().getHours()): MealSlot {
  if (hour >= 5 && hour <= 10) return "breakfast";
  if (hour >= 11 && hour <= 15) return "lunch";
  if (hour >= 16 && hour <= 18) return "snack";
  return "dinner";
}

function defaultTime(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LogFood({
  foods,
  locale = "fa",
  periodId,
}: {
  foods: FoodOption[];
  locale?: string;
  periodId?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [servingUnitId, setServingUnitId] = useState(
    foods[0]?.servingUnits[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState("1");
  const [mealSlot, setMealSlot] = useState<MealSlot>(() => defaultMealSlot());
  const [logDate, setLogDate] = useState(() => tehranTodayIso());
  const [logTime, setLogTime] = useState(() => defaultTime());
  const { pending, error, run, setError } = useActionFeedback();
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const pathname = usePathname() || "";
  const currentLocale = locale || (pathname.split("/")[1] || "fa");
  const tNs = useTranslations("diary");

  const SubmitIcon = pending ? RefreshCw : CirclePlus;

  // Playwright E2E contract anchors (aria-labels stay English literals).
  const t = {
    title: tNs("logTitle"),
    subtitle: tNs("logSubtitle"),
    searchLabel: tNs("logSearchLabel"),
    searchPlaceholder: tNs("logSearchPh"),
    clear: tNs("logClear"),
    foodLabel: tNs("logFood"),
    itemsFound: (count: number) => tNs("logFoundCount", { count: String(count) }),
    servingLabel: tNs("logServing"),
    qtyLabel: tNs("logQty"),
    errorMsg: tNs("logError"),
    successMsg: tNs("logSuccess"),
    viewDiary: tNs("logViewDiary"),
    buttonText: pending ? tNs("logBusy") : tNs("logSubmit"),
  };

  // Real-time search filter for quick lookup
  const filteredFoods = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return foods;
    const matches = foods.filter((f) => f.name.toLowerCase().includes(term));
    return matches.length > 0 ? matches : foods;
  }, [foods, searchTerm]);

  const activeFoodList = filteredFoods.length > 0 ? filteredFoods : foods;
  const food = activeFoodList.find((f) => f.id === foodId) ?? foods.find((f) => f.id === foodId) ?? foods[0];

  function onFoodChange(id: string) {
    setFoodId(id);
    const selected = foods.find((f) => f.id === id);
    setServingUnitId(selected?.servingUnits[0]?.id ?? "");
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/20">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <CirclePlus size={24} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            {t.title}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {t.subtitle}
          </p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 gap-4 text-start"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setSuccess(false);
          const loggedAtMs = Date.parse(`${logDate}T${logTime}`);
          run(
            () =>
              logIntake({
                foodId: food?.id ?? foodId,
                servingUnitId,
                quantity: Number(quantity),
                mealSlot,
                ...(periodId ? { periodId } : {}),
                ...(Number.isNaN(loggedAtMs) ? {} : { loggedAt: new Date(loggedAtMs).toISOString() }),
              }),
            {
              successKey: "successLogged",
              onOk: () => {
                setSuccess(true);
                router.refresh();
                setTimeout(() => setSuccess(false), 5000);
              },
            },
          );
        }}
      >
        {/* Quick Search Filter (Only rendered when there are multiple foods to browse) */}
        {foods.length > 3 && (
          <div>
            <label
              htmlFor="food-search-filter"
              className="block text-xs font-bold text-on-surface mb-1"
            >
              {t.searchLabel}
            </label>
            <div className="relative flex items-center">
              <input
                id="food-search-filter"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-surface-container-low rounded-xl ps-9 pe-3 py-2 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
              />
              <span className="absolute start-2.5 text-on-surface-variant">
                <Search size={16} aria-hidden="true" />
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute end-2.5 text-xs text-on-surface-variant hover:text-on-surface"
                >
                  {t.clear}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Food Select (Preserves Playwright getByLabel('Food')) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="food-select"
              className="block text-xs sm:text-sm font-bold text-on-surface"
            >
              {t.foodLabel}
            </label>
            {searchTerm && (
              <span className="text-[11px] text-primary font-semibold">
                {t.itemsFound(activeFoodList.length)}
              </span>
            )}
          </div>
          <select
            id="food-select"
            aria-label="Food"
            value={foodId}
            onChange={(e) => onFoodChange(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
          >
            {activeFoodList.map((f) => (
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
            {t.servingLabel}
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
            {t.qtyLabel}
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

        {/* Meal Slot Select */}
        <div>
          <label
            htmlFor="meal-slot-select"
            className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
          >
            وعده غذایی
          </label>
          <select
            id="meal-slot-select"
            aria-label="Meal slot"
            value={mealSlot}
            onChange={(e) => setMealSlot(e.target.value as MealSlot)}
            className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
          >
            <option value="breakfast">صبحانه</option>
            <option value="lunch">ناهار</option>
            <option value="dinner">شام</option>
            <option value="snack">میان‌وعده</option>
          </select>
        </div>

        {/* Logged-at Jalali date + time */}
        <div>
          <span
            id="logged-at-label"
            className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
          >
            زمان ثبت
          </span>
          <div
            role="group"
            aria-labelledby="logged-at-label"
            className="grid grid-cols-2 gap-2"
          >
            <JalaliDatePicker
              locale={currentLocale}
              value={logDate}
              onChange={setLogDate}
              id="logged-at-date"
            />
            <input
              id="logged-at-time"
              aria-label="Logged at"
              type="time"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30 text-start"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-error text-xs font-bold mt-1">
            {error}
          </p>
        )}

        {success && (
          <div className="bg-primary/10 border border-primary/30 p-3 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-primary mt-1">
            <div className="flex items-center gap-1.5">
              <CircleCheckBig size={16} aria-hidden="true" />
              <span>{t.successMsg}</span>
            </div>
            <Link
              href={`/${currentLocale}/nutrition/calorie`}
              className="text-[11px] underline hover:text-primary-container"
            >
              {t.viewDiary}
            </Link>
          </div>
        )}

        {/* Submit button (Preserves Playwright getByRole('button', { name: 'Log intake' })) */}
        <button
          type="submit"
          disabled={pending}
          aria-label="Log intake"
          className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          <SubmitIcon
            size={20}
            className={pending ? "animate-spin" : ""}
            aria-hidden="true"
          />
          <span>{t.buttonText}</span>
        </button>
      </form>
    </div>
  );
}