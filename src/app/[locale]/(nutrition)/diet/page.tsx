import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { listPrograms, myClaims, getProgramContent } from "@/contexts/nutrition/queries";
import { claimDietProgram } from "@/contexts/nutrition/actions";
import { isPricedProgram } from "@/contexts/nutrition/kernel";
import { formatPersianNumber, toPersianDigits } from "@/lib/format";
import {
  BadgeCheck,
  Building2,
  CircleCheckBig,
  ClipboardCheck,
  Download,
  Flower2,
  GraduationCap,
  Hospital,
  Hourglass,
  Landmark,
  ShieldPlus,
  Stethoscope,
  X,
  type LucideIcon,
} from "lucide-react";

const CONTEXT_DEFS: Record<string, { icon: LucideIcon; labelKey: string; hintKey: string }> = {
  clinics: { icon: Hospital, labelKey: "dietContextClinicsLabel", hintKey: "dietContextClinicsHint" },
  health_centers: { icon: ShieldPlus, labelKey: "dietContextHealthCentersLabel", hintKey: "dietContextHealthCentersHint" },
  banks: { icon: Landmark, labelKey: "dietContextBanksLabel", hintKey: "dietContextBanksHint" },
  universities: { icon: GraduationCap, labelKey: "dietContextUniversitiesLabel", hintKey: "dietContextUniversitiesHint" },
  other: { icon: Building2, labelKey: "dietContextOtherLabel", hintKey: "dietContextOtherHint" },
};

type ContextKey = keyof typeof CONTEXT_DEFS;
const CONTEXT_IDS = Object.keys(CONTEXT_DEFS) as ContextKey[];

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
  const t = await getTranslations("nutrition");

  const selectedContext: ContextKey =
    context && CONTEXT_IDS.includes(context as ContextKey)
      ? (context as ContextKey)
      : "clinics";

  const [programs, claims] = await Promise.all([
    listPrograms(selectedContext, locale),
    myClaims(user.id),
  ]);

  const claimedProgramIds = new Set(claims.map((c) => c.programId));

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

  const durationText = (days: number) =>
    t("dietDuration", { days: locale === "en" ? String(days) : toPersianDigits(days) });
  const activeCount = (count: number) =>
    t("dietActiveCount", { count: locale === "en" ? String(count) : toPersianDigits(count) });
  const formatPrice = (v: number | string) =>
    locale === "en" ? Number(v).toLocaleString("en-US") : formatPersianNumber(Number(v));
  const formatPhone = (v: string) => (locale === "en" ? v : toPersianDigits(v));

  return (
    <div className="flex flex-col gap-8 text-start" dir={locale === "en" ? "ltr" : "rtl"}>
      {/* Organization/Clinic Context Selector (Screens #16, #24, #26) */}
      <section aria-label={t("dietFilterAria")} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-on-surface">
              {t("dietFilterTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t("dietFilterSubtitle")}
            </p>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            {activeCount(programs.length)}
          </span>
        </div>

        {/* Filter Pills for Organization Contexts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CONTEXT_IDS.map((cid) => {
            const c = CONTEXT_DEFS[cid];
            const label = t(c.labelKey);
            const hint = t(c.hintKey);
            const isSelected = selectedContext === cid;
            return (
              <Link
                key={cid}
                href={`?context=${cid}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <c.icon
                  size={18}
                  className={isSelected ? "text-on-primary" : "text-primary"}
                  aria-hidden="true"
                />
                <span>{label}</span>
                <span
                  className={`hidden sm:inline-block text-[10px] font-normal ${
                    isSelected ? "text-on-primary/80" : "text-on-surface-variant/75"
                  }`}
                >
                  ({hint})
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Claim review + confirm (ticket 13): reachable from every program card */}
      {reviewProgram && (
        <section
          aria-label="ClaimReview"
          className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-primary/40 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck size={22} aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
              {t("dietReviewTitle")}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm sm:text-base text-on-surface">{reviewProgram.name}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {reviewProgram.planType || t("dietDefaultPlanType")} • {durationText(reviewProgram.durationDays)}
                {reviewProgram.practitionerName && ` • ${reviewProgram.practitionerName}`}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              {isPricedProgram(reviewProgram.price) ? (
                <>
                  <span className="text-xl font-extrabold text-on-surface font-data-metric">
                    {formatPrice(reviewProgram.price)}
                  </span>
                  <span className="text-xs text-on-surface-variant">{t("dietCurrency")}</span>
                </>
              ) : (
                <span className="text-base font-extrabold text-primary">{t("dietFree")}</span>
              )}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t("dietReviewNote")}
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
                <CircleCheckBig size={18} aria-hidden="true" />
                <span>{t("dietConfirmBtn")}</span>
              </button>
            </form>
            <Link
              href={`?context=${selectedContext}`}
              aria-label="CancelClaim"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all"
            >
              <X size={18} aria-hidden="true" />
              <span>{t("dietCancelBtn")}</span>
            </Link>
          </div>
        </section>
      )}

      {/* Clinical Diet Packages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {programs.length === 0 ? (
          <div className="col-span-full bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40">
            <Flower2 size={40} className="text-on-surface-variant/40 mb-2" aria-hidden="true" />
            <h3 className="text-base font-bold text-on-surface">
              {t("dietEmptyTitle")}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {t("dietEmptyHint")}
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
                      {p.planType || t("dietDefaultPlanType")}
                    </span>
                    <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">
                      {durationText(p.durationDays)}
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
                        <Stethoscope size={22} aria-hidden="true" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs sm:text-sm text-on-surface">
                            {p.practitionerName ?? t("dietDefaultPractitioner")}
                          </span>
                          <BadgeCheck size={16} className="text-primary" aria-hidden="true" />
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          {t("dietMonitorRole")}
                          {p.practitionerPhone && ` • ${t("dietPhonePrefix")} ${formatPhone(p.practitionerPhone)}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-lg">
                      {t("dietOnlineBadge")}
                    </span>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="pt-5 mt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">
                      {t("dietFeeWithSupport")}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-on-surface font-data-metric">
                        {formatPrice(p.price)}
                      </span>
                      <span className="text-xs text-on-surface-variant">{t("dietCurrency")}</span>
                    </div>
                  </div>

                  {/* Claim Status Badge / Action */}
                  {isClaimed ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <span
                        aria-label="Pending"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm"
                      >
                        <Hourglass size={16} aria-hidden="true" />
                        <span>{t("dietPendingText")}</span>
                      </span>
                      <Link
                        href={`./${p.id}`}
                        aria-label="ViewDownload"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs sm:text-sm hover:bg-primary/20 transition-all"
                      >
                        <Download size={16} aria-hidden="true" />
                        <span>{t("dietViewDownload")}</span>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`?context=${selectedContext}&claim=${p.id}`}
                      aria-label="Claim"
                      className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
                    >
                      <CircleCheckBig size={18} aria-hidden="true" />
                      <span>{t("dietClaimText")}</span>
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