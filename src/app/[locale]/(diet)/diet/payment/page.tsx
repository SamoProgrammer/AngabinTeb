import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/contexts/identity/actions";
import { getMyClaim } from "@/contexts/nutrition/queries";
import { markDietClaimPaid } from "@/contexts/nutrition/actions";
import { Wallet } from "lucide-react";

const ORG_LABEL_KEYS: Record<string, string> = {
  clinics: "dietContextClinicsLabel",
  health_centers: "dietContextHealthCentersLabel",
  banks: "dietContextBanksLabel",
  universities: "dietContextUniversitiesLabel",
  other: "dietContextOtherLabel",
};

export default async function DietPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ claim?: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const { claim: claimId } = await searchParams;
  const t = await getTranslations("nutrition");
  const dir = locale === "en" ? "ltr" : "rtl";

  if (typeof claimId !== "string" || !claimId) notFound();
  const claim = await getMyClaim(user.id, claimId);
  if (!claim) notFound();
  if (claim.status !== "pending") redirect(`/${locale}/diet/check?claim=${claim.claimId}`);

  const orgLabel = claim.organizationContext
    ? t(ORG_LABEL_KEYS[claim.organizationContext] ?? "dietContextOtherLabel")
    : t("dietWizard.orgNoneLabel");

  return (
    <div className="flex flex-col gap-6 text-start" dir={dir}>
      <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
        {t("dietWizard.payTitle")}
      </h1>
      <section
        aria-label="PaymentReview"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
      >
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-on-surface-variant text-xs">{t("dietWizard.payProgram")}</dt>
            <dd className="font-bold text-on-surface text-start">{claim.programName}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-on-surface-variant text-xs">{t("dietWizard.payTier")}</dt>
            <dd className="font-bold text-on-surface">{claim.planType}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-on-surface-variant text-xs">{t("dietWizard.payOrg")}</dt>
            <dd className="font-bold text-on-surface">{orgLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-outline-variant/20 pt-3">
            <dt className="text-on-surface-variant text-xs">{t("dietWizard.payPrice")}</dt>
            <dd className="text-xl font-extrabold text-on-surface font-data-metric">
              {claim.pricePaid ?? claim.price} {t("dietCurrency")}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-on-surface-variant leading-relaxed">{t("dietWizard.payNote")}</p>
        <form
          action={async () => {
            "use server";
            await markDietClaimPaid(claim.claimId);
            redirect(`/${locale}/diet/check?claim=${claim.claimId}`);
          }}
        >
          <button
            type="submit"
            aria-label="ConfirmPay"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all"
          >
            <Wallet size={18} aria-hidden="true" />
            <span>{t("dietWizard.payConfirm")}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
