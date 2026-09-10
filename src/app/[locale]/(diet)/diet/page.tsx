import { getTranslations } from "next-intl/server";
import { PendingButton } from "@/components/clinical/pending-button";
import { PendingLink } from "@/components/clinical/pending-link";
import { redirect } from "next/navigation";
import { listProgramTypes, listProgramsByType } from "@/contexts/nutrition/queries";
import { claimDietProgram } from "@/contexts/nutrition/actions";
import { formatPersianNumber, toPersianDigits } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleCheckBig,
  CircleUserRound,
  Flower2,
  GraduationCap,
  Hospital,
  Landmark,
  Salad,
  ShieldPlus,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

// Diet program definitions, carried over from the old (nutrition)/diet page — never
// import across route groups. Plus the "no organization" null option.
const CONTEXT_DEFS: Record<string, { icon: LucideIcon; labelKey: string; hintKey: string }> = {
  clinics: { icon: Hospital, labelKey: "dietContextClinicsLabel", hintKey: "dietContextClinicsHint" },
  health_centers: { icon: ShieldPlus, labelKey: "dietContextHealthCentersLabel", hintKey: "dietContextHealthCentersHint" },
  banks: { icon: Landmark, labelKey: "dietContextBanksLabel", hintKey: "dietContextBanksHint" },
  universities: { icon: GraduationCap, labelKey: "dietContextUniversitiesLabel", hintKey: "dietContextUniversitiesHint" },
  other: { icon: Building2, labelKey: "dietContextOtherLabel", hintKey: "dietContextOtherHint" },
};

type ContextKey = keyof typeof CONTEXT_DEFS;
const CONTEXT_IDS = Object.keys(CONTEXT_DEFS) as ContextKey[];

async function claimAndGo(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "fa");
  const r = await claimDietProgram(formData);
  if (r.ok) redirect(`/${locale}/diet/payment?claim=${r.claimId}`);
  if ("reason" in r && r.reason === "already_claimed") redirect(`/${locale}/profile/diets`);
  redirect(`/${locale}/diet`);
}

export default async function DietWizardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string; type?: string; program?: string; org?: string }>;
}) {
  const { locale } = await params;
  const { step, type, program, org } = await searchParams;
  const t = await getTranslations("nutrition");
  const ts = await getTranslations("states");
  const typeLabel = (pt: string) => {
    const key = `dietWizard.dietType.${pt}`;
    const v = t(key);
    return v === key ? pt : v;
  };
  const dir = locale === "en" ? "ltr" : "rtl";
  const BackIcon = locale === "en" ? ArrowLeft : ArrowRight;
  const fmtStep = (n: number) => (locale === "en" ? String(n) : toPersianDigits(n));

  const types = await listProgramTypes();
  const currentStep = step === "2" || step === "3" ? Number(step) : 1;
  const selectedType = typeof type === "string" && types.includes(type) ? type : null;
  const programs = selectedType ? await listProgramsByType(selectedType, locale) : [];
  const selectedProgram =
    typeof program === "string" ? programs.find((p) => p.id === program) ?? null : null;
  const selectedOrg: ContextKey | "none" | null =
    typeof org === "string" && (CONTEXT_IDS as string[]).includes(org)
      ? (org as ContextKey)
      : org === "none"
        ? "none"
        : null;

  const durationText = (days: number) =>
    t("dietDuration", { days: locale === "en" ? String(days) : toPersianDigits(days) });
  const formatPrice = (v: number | string) =>
    locale === "en" ? Number(v).toLocaleString("en-US") : formatPersianNumber(Number(v));
  const formatPhone = (v: string) => (locale === "en" ? v : toPersianDigits(v));

  return (
    <div className="flex flex-col gap-8 text-start" dir={dir}>
      <div>
        <p className="text-xs font-bold text-primary">{t("dietWizard.stepOf", { step: fmtStep(currentStep) })}</p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-1">
          {t("dietWizard.title")}
        </h1>
      </div>

      {/* Step 1 — program type cards (public) */}
      {currentStep === 1 && (
        <section aria-label="WizardStep1" className="flex flex-col gap-4">
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            {t("dietWizard.step1Title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {types.map((pt) => (
              <PendingLink
                key={pt}
                href={`?step=2&type=${encodeURIComponent(pt)}`}
                busyLabel={ts("loading")}
                className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex items-center gap-3"
              >
                <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Salad size={24} aria-hidden="true" />
                </span>
                <span className="font-bold text-sm sm:text-base text-on-surface">{typeLabel(pt)}</span>
              </PendingLink>
            ))}
          </div>
        </section>
      )}

      {/* Step 2 — programs of the chosen type (public) */}
      {currentStep === 2 && (
        <section aria-label="WizardStep2" className="flex flex-col gap-4">
          <PendingLink
            href="?step=1"
            busyLabel={ts("loading")}
            className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <BackIcon size={16} aria-hidden="true" />
            <span>{t("dietWizard.back")}</span>
          </PendingLink>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            {t("dietWizard.step2Title")}
          </h2>
          {!selectedType || programs.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40">
              <Flower2 size={40} className="text-on-surface-variant/40 mb-2" aria-hidden="true" />
              <p className="text-sm font-bold text-on-surface">{t("dietWizard.step2Empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {programs.map((p) => (
                <article
                  key={p.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                        {p.planType ? typeLabel(p.planType) : t("dietDefaultPlanType")}
                      </span>
                      <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">
                        {durationText(p.durationDays)}
                      </span>
                    </div>
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
                    <PendingLink
                      href={`?step=3&type=${encodeURIComponent(selectedType)}&program=${p.id}`}
                      aria-label="SelectProgram"
                      busyLabel={ts("loading")}
                      className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
                    >
                      <CircleCheckBig size={18} aria-hidden="true" />
                      <span>{t("dietWizard.selectCta")}</span>
                    </PendingLink>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 3 — org + price preview + claim (public viewing; claiming signs in) */}
      {currentStep === 3 && (
        <section aria-label="WizardStep3" className="flex flex-col gap-4">
          <PendingLink
            href={selectedType ? `?step=2&type=${encodeURIComponent(selectedType)}` : "?step=1"}
            busyLabel={ts("loading")}
            className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <BackIcon size={16} aria-hidden="true" />
            <span>{t("dietWizard.back")}</span>
          </PendingLink>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            {t("dietWizard.step3Title")}
          </h2>
          {!selectedProgram ? (
            <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40">
              <Flower2 size={40} className="text-on-surface-variant/40 mb-2" aria-hidden="true" />
              <p className="text-sm font-bold text-on-surface">{t("dietWizard.step2Empty")}</p>
            </div>
          ) : (
            <>
              <p className="font-bold text-sm sm:text-base text-on-surface">{selectedProgram.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTEXT_IDS.map((cid) => {
                  const c = CONTEXT_DEFS[cid];
                  const isSelected = selectedOrg === cid;
                  return (
                    <PendingLink
                      key={cid}
                      href={`?step=3&type=${encodeURIComponent(selectedType ?? "")}&program=${selectedProgram.id}&org=${cid}`}
                      aria-label={`Org-${cid}`}
                      busyLabel={ts("loading")}
                      className={`flex items-center gap-2.5 p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-on-surface"
                          : "border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:border-primary/50"
                      }`}
                    >
                      <c.icon size={22} className="text-primary shrink-0" aria-hidden="true" />
                      <span className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm">{t(c.labelKey)}</span>
                        <span className="text-[11px] text-on-surface-variant">{t(c.hintKey)}</span>
                      </span>
                    </PendingLink>
                  );
                })}
                <PendingLink
                  key="none"
                  href={`?step=3&type=${encodeURIComponent(selectedType ?? "")}&program=${selectedProgram.id}&org=none`}
                  aria-label="Org-none"
                  busyLabel={ts("loading")}
                  className={`flex items-center gap-2.5 p-4 rounded-2xl border transition-all ${
                    selectedOrg === "none"
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:border-primary/50"
                  }`}
                >
                  <CircleUserRound size={22} className="text-primary shrink-0" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="font-bold text-xs sm:text-sm">{t("dietWizard.orgNoneLabel")}</span>
                        <span className="text-[11px] text-on-surface-variant">{t("dietWizard.orgNoneHint")}</span>
                      </span>
                    </PendingLink>
              </div>
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant">{t("dietWizard.priceLabel")}</span>
                  <span className="text-xl font-extrabold text-on-surface font-data-metric">
                    {selectedProgram.price} {t("dietCurrency")}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  {t("dietWizard.orgNote")}
                </p>
                <form action={claimAndGo} className="flex flex-col gap-2">
                  <input type="hidden" name="programId" value={selectedProgram.id} />
                  {selectedOrg && selectedOrg !== "none" && (
                    <input type="hidden" name="organizationContext" value={selectedOrg} />
                  )}
                  <input type="hidden" name="locale" value={locale} />
                  <PendingButton
                    aria-label="ConfirmClaim"
                    className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
                  >
                    <CircleCheckBig size={18} aria-hidden="true" />
                    <span>{t("dietWizard.claimCta")}</span>
                  </PendingButton>
                  <p className="text-[11px] text-on-surface-variant">{t("dietWizard.signinNote")}</p>
                </form>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
