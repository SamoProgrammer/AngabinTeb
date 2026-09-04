import Link from "next/link";
import { notFound } from "next/navigation";
import { getFoodDetail } from "@/contexts/nutrition/queries";
import { LogFood } from "@/components/nutrition/log-food";
import { toPersianDigits } from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const food = await getFoodDetail(id, locale);
  if (!food) notFound();

  // Find primary macros from nutrient table
  const energyNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-energy" || n.name.includes("کالری") || n.name.includes("Energy")
  );
  const proteinNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-protein" || n.name.includes("پروتئین") || n.name.includes("Protein")
  );
  const carbsNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-carbs" || n.name.includes("کربوهیدرات") || n.name.includes("Carbs")
  );
  const fatNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-fat" || n.name.includes("چربی") || n.name.includes("Fat")
  );

  return (
    <div className="flex flex-col gap-8 text-right" dir="rtl">
      {/* 1. Breadcrumb (Screen #17) */}
      <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href={`/${locale}/nutrition`} className="hover:text-primary transition-colors">
          سامانه انگبین طب
        </Link>
        <span>/</span>
        <Link href={`/${locale}/nutrition/foods`} className="hover:text-primary transition-colors">
          پایگاه داده تغذیه بالینی
        </Link>
        <span>/</span>
        <span className="text-primary font-bold">{food.name}</span>
      </nav>

      {/* 2. Hero & Identity Section (Screen #17) */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-outline-variant/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Icon / Header (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-surface-container-low rounded-3xl border border-outline-variant/20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-xs mb-4">
              <ClinicalIcon name="flatware" size={48} />
            </div>
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
              {food.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {food.name}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              پروفایل تحلیلی مواد مغذی و مقیاس‌های خانگی
            </p>
          </div>

          {/* Core Info & Macro Bars (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Serving Units Strip */}
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-on-surface mb-2">
                واحدهای مصرفی و مقیاس‌های سنتی ثبت‌شده:
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {food.servingUnits.map((su) => (
                  <div
                    key={su.id}
                    className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20 flex flex-col text-center"
                  >
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      {su.name}
                    </span>
                    <span className="text-[11px] text-primary font-semibold mt-0.5">
                      {toPersianDigits(su.gramsEquivalent)} گرم
                    </span>
                  </div>
                ))}
                {food.servingUnits.length === 0 && (
                  <p className="text-xs text-on-surface-variant col-span-full">
                    واحد مصرفی خاصی ثبت نشده است.
                  </p>
                )}
              </div>
            </div>

            {/* Macro Highlights per 100g */}
            <div className="bg-surface-container-low/60 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  انرژی و درشت‌مغذی‌ها در هر ۱۰۰ گرم:
                </span>
                <span className="text-xs font-bold text-primary">
                  {toPersianDigits(energyNutrient?.amountPer100g ?? "—")} {energyNutrient?.unit ?? "kcal"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
                  <span className="text-on-surface-variant block">پروتئین</span>
                  <span className="font-bold text-primary block mt-0.5">
                    {toPersianDigits(proteinNutrient?.amountPer100g ?? "—")} {proteinNutrient?.unit ?? "g"}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
                  <span className="text-on-surface-variant block">کربوهیدرات</span>
                  <span className="font-bold text-secondary block mt-0.5">
                    {toPersianDigits(carbsNutrient?.amountPer100g ?? "—")} {carbsNutrient?.unit ?? "g"}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
                  <span className="text-on-surface-variant block">چربی کل</span>
                  <span className="font-bold text-tertiary block mt-0.5">
                    {toPersianDigits(fatNutrient?.amountPer100g ?? "—")} {fatNutrient?.unit ?? "g"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Nutrient Table & Quick Logger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Full Nutrients Table (7 cols) */}
        <section
          aria-label="جدول کامل ریزمغذی‌ها"
          className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                املاح، ویتامین‌ها و ریزمغذی‌های شاخص
              </h2>
              <p className="text-xs text-on-surface-variant">ارزش‌های تغذیه‌ای به ازای هر ۱۰۰ گرم خوراک</p>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              {toPersianDigits(food.nutrients.length)} مولفه
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold">
                  <th className="py-2.5 px-2">ماده مغذی / املاح</th>
                  <th className="py-2.5 px-2">واحد</th>
                  <th className="py-2.5 px-2">مقدار در ۱۰۰ گرم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {food.nutrients.map((n) => (
                  <tr key={n.nutrientId} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-2.5 px-2 font-semibold text-on-surface">{n.name}</td>
                    <td className="py-2.5 px-2 text-on-surface-variant">{n.unit}</td>
                    <td className="py-2.5 px-2 font-bold text-primary font-data-metric">
                      {toPersianDigits(n.amountPer100g)}
                    </td>
                  </tr>
                ))}
                {food.nutrients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-on-surface-variant">
                      اطلاعات ریزمغذی دقیق برای این مورد در سامانه ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Doctor's Clinical Advice Card (Screen #17) */}
          <div className="mt-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClinicalIcon name="stethoscope" size={22} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs text-on-surface">
                توصیه بالینی متخصص تغذیه • دکتر سحر فرهمندفر
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                تفت ملایم با روغن زیتون فرابکر یا کنجد و استفاده از چاشنی‌های آنتی‌اکسیدانی سنتی مانند لیمو عمانی طبیعی، پلی‌فنول‌ها را حفظ کرده و نیاز به افزودن نمک اضافی را کاهش می‌دهد.
              </p>
            </div>
          </div>
        </section>

        {/* Embedded LogFood Section (5 cols) */}
        <section aria-label="ثبت در دفترچه" className="lg:col-span-5">
          <LogFood
            foods={[
              {
                id: food.id,
                name: food.name,
                servingUnits: food.servingUnits.map((su) => ({
                  id: su.id,
                  name: su.name,
                })),
              },
            ]}
          />
        </section>
      </div>

      {/* 4. Complementary Persian Table Pairings (Screen #17) */}
      <section aria-label="خوراک‌های مکمل سفره ایرانی">
        <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm mb-2">
          <ClinicalIcon name="sync_alt" size={18} />
          <span>هم‌افزایی سفره اصیل ایرانی بر اساس هضم فیزیولوژیک</span>
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-1">
          خوراک‌های مکمل و چیدمان بهینه سفره
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-4">
          ترکیب این خوراک با چاشنی‌های سنتی جهت تعادل طبع، پایش گلیسمی و سلامت میکروبیوم روده:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pairing 1 */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                کربوهیدرات مرجع
              </span>
              <h4 className="font-bold text-sm sm:text-base text-on-surface mt-2">
                پلو کته زعفرانی کم‌روغن
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                طبخ کته به جای آبکش جهت حفظ ویتامین‌های گروه B و نشاسته مقاوم.
              </p>
            </div>
            <span className="text-[11px] text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/20 block">
              اندازه استاندارد: ۶ قاشق (~ ۱۶۰ kcal)
            </span>
          </div>

          {/* Pairing 2 */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <span className="bg-secondary/10 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-full">
                فیبر محلول و آنتی‌اکسیدان
              </span>
              <h4 className="font-bold text-sm sm:text-base text-on-surface mt-2">
                سالاد شیرازی با آبغوره سنتی
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                اسید استیک آبغوره طبیعی جهرم شیب جهش قند خون پس از صرف غذا را مهار می‌کند.
              </p>
            </div>
            <span className="text-[11px] text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/20 block">
              اندازه استاندارد: ۱ پیاله (~ ۴۵ kcal)
            </span>
          </div>

          {/* Pairing 3 */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <span className="bg-tertiary/10 text-tertiary text-[11px] font-bold px-2 py-0.5 rounded-full">
                پروبیوتیک و سلامت روده
              </span>
              <h4 className="font-bold text-sm sm:text-base text-on-surface mt-2">
                ماست و نعناع پروبیوتیک سنتی
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                سویه‌های زنده لاکتوباسیلوس جهت بهینه‌سازی هضم و نعنای کوهی برای رفع نفخ.
              </p>
            </div>
            <span className="text-[11px] text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/20 block">
              اندازه استاندارد: ۱ پیاله (~ ۸۰ kcal)
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}