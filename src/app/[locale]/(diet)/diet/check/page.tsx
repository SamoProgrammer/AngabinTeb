import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/contexts/identity/actions";
import { getMyClaim, getRegistryStatus } from "@/contexts/nutrition/queries";
import { freezeRegistrySnapshotForUser, advanceDoctorClaimToReview } from "@/contexts/nutrition/actions";
import { ClipboardCheck } from "lucide-react";

export default async function DietCheckPage({
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
  const claim = await getMyClaim(user.id, claimId, locale);
  if (!claim) notFound();
  if (claim.status === "pending") redirect(`/${locale}/diet/payment?claim=${claim.claimId}`);

  // Re-freeze on every load (idempotent by unique claim_id): the user may
  // have just returned from the clinical form, which posts to submitRegistry
  // itself — this call picks up the fresh dossier for paid claims.
  await freezeRegistrySnapshotForUser(user.id);
  const status = await getRegistryStatus(user.id);
  if (status.complete) {
    if (claim.fulfillmentType === "doctor" && claim.status === "paid") {
      await advanceDoctorClaimToReview(claim.claimId);
    }
    redirect(`/${locale}/profile/diets/${claim.claimId}`);
  }

  return (
    <div className="flex flex-col gap-6 text-start" dir={dir}>
      <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
        {t("dietWizard.checkTitle")}
      </h1>
      <section
        aria-label="RegistryCheck"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
      >
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {t("dietWizard.checkDesc")}
        </p>
        <Link
          href={`/${locale}/profile/clinical?return=/diet/check?claim=${claim.claimId}`}
          aria-label="CompleteRegistry"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all"
        >
          <ClipboardCheck size={18} aria-hidden="true" />
          <span>{t("dietWizard.checkCta")}</span>
        </Link>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          {t("dietWizard.checkReturnNote")}
        </p>
      </section>
    </div>
  );
}
