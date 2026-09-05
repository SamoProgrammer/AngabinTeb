import Link from "next/link";
import { requireUser } from "@/contexts/identity/actions";
import { listPrograms, myClaims, getProgramContent } from "@/contexts/nutrition/queries";
import { claimDietProgram } from "@/contexts/nutrition/actions";
import { isPricedProgram } from "@/contexts/nutrition/kernel";
import { formatPersianNumber, toPersianDigits } from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const CONTEXTS = [
  { id: "clinics", label: "کلینیک‌های تخصصی", icon: "local_hospital" },
  { id: "health_centers", label: "مراکز جامع سلامت", icon: "health_and_safety" },
  { id: "banks", label: "بانک‌ها و موسسات مالی", icon: "account_balance" },
  { id: "universities", label: "دانشگاه‌ها و مراکز علمی", icon: "school" },
  { id: "other", label: "الگوهای عمومی و سازمان‌ها", icon: "corporate_fare" },
] as const;

const CONTEXT_IDS = CONTEXTS.map((c) => c.id);

export default async function DietPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ context?: string; claim?: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const { context, claim } = await searchParams;

  const selectedContext =
    context && CONTEXT_IDS.includes(context as (typeof CONTEXT_IDS)[number])
      ? context
      : "clinics";

  const [programs, claims] = await Promise.all([
    listPrograms(selectedContext, locale),
    myClaims(user.id),
  ]);

  const claimedProgramIds = new Set(claims.map((c) => c.programId));

  // Review-before-claim: ?claim=<programId> shows a confirmation card.
  // Falls back to the gated content query so cross-context programs resolve too.
  let reviewProgram: (typeof programs)[number] | null = null;
  if (typeof claim === "string" && claim && !claimedProgramIds.has(claim)) {
    reviewProgram = programs.find((p) => p.id === claim) ?? null;
    if (!reviewProgram) {
      const content = await getProgramContent(claim, user.id, locale);
      if (content && !content.hasClaim) {
        reviewProgram = {
          id: content.id,
          name: content.name,
          description: content.description,
          organizationContext: content.organizationContext,
          planType: content.planType,
          durationDays: content.durationDays,
          price: content.price,
          practitionerName: content.practitionerName,
          practitionerPhone: content.practitionerPhone,
        };
      }
    }
  }

  return (
    <div className="flex flex-col gap-8 text-start" dir="rtl">
      {/* Top Ambient Banner: Clinical Philosophy (Screens #16, #24, #26) */}
      <section
        aria-label="معرفی پزشکی تغذیه بالینی"
        className="relative overflow-hidden bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30"
      >
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 self-start bg-surface-container-lowest px-3 py-1 rounded-full shadow-2xs border border-outline-variant/30">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary">
              پزشکی تغذیه و طب متابولیک انگبین طب
            </span>
            <span className="text-[11px] text-on-surface-variant">
              | نسخه تاییدشده بالینی
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-snug">
            برنامه‌های رژیم درمانی و پایش بالینی
            <span className="text-primary block mt-1">
              سلامت اصیل بدون گرسنگی‌های فرساینده
            </span>
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            رویکرد ما در انگبین طب ترکیب داده‌های آزمایشگاهی دقیق، فیزیولوژی غدد و سنت تغذیه اصیل ایرانی است. این رژیم‌ها بر پایه محاسبه بار گلیسمی بومی، اصلاح فلور روده و بهبود ریتم انرژی تدوین شده‌اند تا سلامت پایدار در سفره خانواده محقق گردد.
          </p>
        </div>
      </section>

      {/* Organization/Clinic Context Selector (Screens #16, #24, #26) */}
      <section aria-label="فیلتر سازمان‌ها و الگوهای درمانی" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-on-surface">
              انتخاب بسته متناسب با شرایط سازمانی و درمانی
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              دسته‌بندی الگوهای زیستی و پروتکل‌های تخصصی
            </p>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            نمایش {toPersianDigits(programs.length)} برنامه فعال
          </span>
        </div>

        {/* Filter Pills for Organization Contexts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CONTEXTS.map((c) => {
            const isSelected = selectedContext === c.id;
            return (
              <Link
                key={c.id}
                href={`?context=${c.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <ClinicalIcon
                  name={c.icon}
                  size={18}
                  className={isSelected ? "text-on-primary" : "text-primary"}
                />
                <span>{c.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Traditional Form Selector Fallback / Explicit Context Select */}
        <form method="GET" className="flex items-center gap-2 max-w-md mt-1">
          <label className="flex flex-1 items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span>سازمان یا مرکز همکار:</span>
            <select
              name="context"
              defaultValue={selectedContext}
              className="flex-1 bg-surface-container-low text-on-surface rounded-xl px-3 py-2 text-xs font-bold border border-outline-variant/30 focus:outline-none"
            >
              {CONTEXTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            اعمال
          </button>
        </form>
      </section>

      {/* Claim review + confirm (ticket 13): reachable from every program card */}
      {reviewProgram && (
        <section
          aria-label="ClaimReview"
          className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-primary/40 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-primary">
            <ClinicalIcon name="fact_check" size={22} />
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
              بازبینی و تأیید درخواست رژیم
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm sm:text-base text-on-surface">{reviewProgram.name}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {reviewProgram.planType} • دوره {toPersianDigits(reviewProgram.durationDays)} روزه
                {reviewProgram.practitionerName && ` • ${reviewProgram.practitionerName}`}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              {isPricedProgram(reviewProgram.price) ? (
                <>
                  <span className="text-xl font-extrabold text-on-surface font-data-metric">
                    {formatPersianNumber(Number(reviewProgram.price))}
                  </span>
                  <span className="text-xs text-on-surface-variant">تومان</span>
                </>
              ) : (
                <span className="text-base font-extrabold text-primary">رایگان</span>
              )}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            با تأیید، درخواست شما برای تیم بالینی ثبت می‌شود و دریافت فایل برنامه برای حساب شما فعال
            می‌گردد. پرداخت آنلاین (در صورت نیاز) بعداً به همین درخواست متصل می‌شود، نه به نوبت‌دهی.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <form
              action={async (formData) => {
                "use server";
                await claimDietProgram(formData);
              }}
            >
              <input type="hidden" name="programId" value={reviewProgram.id} />
              <button
                type="submit"
                aria-label="ConfirmClaim"
                className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ClinicalIcon name="check_circle" size={18} />
                <span>تأیید و ثبت درخواست</span>
              </button>
            </form>
            <Link
              href={`?context=${selectedContext}`}
              aria-label="CancelClaim"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all"
            >
              <ClinicalIcon name="close" size={18} />
              <span>انصراف</span>
            </Link>
          </div>
        </section>
      )}

      {/* Clinical Diet Packages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {programs.length === 0 ? (
          <div className="col-span-full bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40">
            <ClinicalIcon name="spa" size={40} className="text-on-surface-variant/40 mb-2" />
            <h3 className="text-base font-bold text-on-surface">
              برنامه‌ای برای این دسته‌بندی یافت نشد.
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              لطفاً دسته‌بندی دیگری را از نوار بالای صفحه انتخاب فرمایید.
            </p>
          </div>
        ) : (
          programs.map((p) => {
            const isClaimed = claimedProgramIds.has(p.id);
            return (
              <article
                key={p.id}
                className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
              >
                <div className="flex flex-col gap-4">
                  {/* Top Badge & Duration */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {p.planType || "پروتکل بالینی"}
                    </span>
                    <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">
                      دوره {toPersianDigits(p.durationDays)} روزه
                    </span>
                  </div>

                  {/* Program Title & Description */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-on-surface leading-snug">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Practitioner Attribution */}
                  <div className="bg-surface-container-low p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 border border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <ClinicalIcon name="stethoscope" size={22} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs sm:text-sm text-on-surface">
                            {p.practitionerName ?? "تیم متخصصان تغذیه بالینی"}
                          </span>
                          <ClinicalIcon name="verified" size={16} className="text-primary" />
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          پایشگر اختصاصی رژیم‌درمانی
                          {p.practitionerPhone && ` • تلفن: ${toPersianDigits(p.practitionerPhone)}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-lg">
                      پایش آنلاین
                    </span>
                  </div>

                  {/* Sample Day Menu Peek */}
                  <div className="bg-surface-container p-3 sm:p-4 rounded-2xl flex flex-col gap-1.5 text-xs text-on-surface-variant">
                    <div className="flex items-center justify-between text-on-surface font-bold">
                      <span className="flex items-center gap-1.5 text-primary">
                        <ClinicalIcon name="restaurant_menu" size={16} />
                        <span>نمونه یک روز رژیم درمانی</span>
                      </span>
                      <span className="text-[11px] text-secondary">بدون گرسنگی مفرط</span>
                    </div>
                    <p className="leading-relaxed mt-0.5">
                      <strong className="text-on-surface">صبحانه:</strong> نان جو دوسر سنتی + پنیر کم‌نمک + گردو. <br />
                      <strong className="text-on-surface">ناهار:</strong> خورش قورمه‌سبزی کم‌چرب با کته طارم و سالاد شیرازی. <br />
                      <strong className="text-on-surface">شام:</strong> سوپ سبزیجات و فیبر طبیعی با لیمو عمانی.
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant pt-1">
                    <div className="flex items-center gap-1.5">
                      <ClinicalIcon name="check_circle" size={16} className="text-primary shrink-0" />
                      <span>جدول جایگزینی سفره ایرانی</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClinicalIcon name="check_circle" size={16} className="text-primary shrink-0" />
                      <span>پایش روزانه قند و متابولیسم</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClinicalIcon name="check_circle" size={16} className="text-primary shrink-0" />
                      <span>راهنمای آزمون‌های آزمایشگاهی</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClinicalIcon name="check_circle" size={16} className="text-primary shrink-0" />
                      <span>کتابچه دستور پخت سالم PDF</span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="pt-5 mt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">
                      تعرفه دوره با پشتیبانی بالینی:
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-on-surface font-data-metric">
                        {formatPersianNumber(Number(p.price))}
                      </span>
                      <span className="text-xs text-on-surface-variant">تومان</span>
                    </div>
                  </div>

                  {/* Claim Status Badge / Action */}
                  {isClaimed ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <span
                        aria-label="Pending"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm"
                      >
                        <ClinicalIcon name="hourglass_top" size={16} />
                        <span>در حال بررسی</span>
                      </span>
                      <Link
                        href={`./${p.id}`}
                        aria-label="ViewDownload"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs sm:text-sm hover:bg-primary/20 transition-all"
                      >
                        <ClinicalIcon name="download" size={16} />
                        <span>مشاهده و دریافت</span>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`?context=${selectedContext}&claim=${p.id}`}
                      aria-label="Claim"
                      className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
                    >
                      <ClinicalIcon name="check_circle" size={18} />
                      <span>ثبت درخواست رژیم</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}