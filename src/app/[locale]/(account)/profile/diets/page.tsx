import { getTranslations } from "next-intl/server";
import { PendingLink } from "@/components/clinical/pending-link";
import { requireUser } from "@/contexts/identity/actions";
import { myDietClaims } from "@/contexts/nutrition/queries";
import { CircleCheckBig, Hourglass } from "lucide-react";

const STATUS_KEYS: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  generating: "statusGenerating",
  needs_review: "statusNeedsReview",
  ready: "statusReady",
  failed: "statusFailed",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  generating: "bg-orange-100 text-orange-900",
  needs_review: "bg-violet-100 text-violet-900",
  ready: "bg-emerald-100 text-emerald-900",
  failed: "bg-red-100 text-red-900",
};

const ORG_LABEL_KEYS: Record<string, string> = {
  clinics: "dietContextClinicsLabel",
  health_centers: "dietContextHealthCentersLabel",
  banks: "dietContextBanksLabel",
  universities: "dietContextUniversitiesLabel",
  other: "dietContextOtherLabel",
};

export default async function ProfileDietsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const t = await getTranslations("nutrition");
  const ts = await getTranslations("states");
  const dir = locale === "en" ? "ltr" : "rtl";
  const claims = await myDietClaims(user.id, locale);

  return (
    <div className="flex flex-col gap-6 text-start" dir={dir}>
      <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
        {t("dietWizard.listTitle")}
      </h1>
      {claims.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40 flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-on-surface">{t("dietWizard.listEmpty")}</p>
          <PendingLink
            href={`/${locale}/diet`}
            busyLabel={ts("loading")}
            className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
          >
            <CircleCheckBig size={18} aria-hidden="true" />
            <span>{t("dietWizard.listEmptyCta")}</span>
          </PendingLink>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {claims.map((c) => {
            const resumeHref =
              c.status === "pending"
                ? `/${locale}/diet/payment?claim=${c.claimId}`
                : c.status === "paid"
                  ? `/${locale}/diet/check?claim=${c.claimId}`
                  : `/${locale}/profile/diets/${c.claimId}`;
            const resumeLabel =
              c.status === "pending"
                ? t("dietWizard.resumePayment")
                : c.status === "paid"
                  ? t("dietWizard.resumeCheck")
                  : t("dietWizard.viewDetail");
            const orgLabel = c.organizationContext
              ? t(ORG_LABEL_KEYS[c.organizationContext] ?? "dietContextOtherLabel")
              : t("dietWizard.orgNoneLabel");
            const statusKey = STATUS_KEYS[c.status];
            return (
              <article
                key={c.claimId}
                className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-sm sm:text-base text-on-surface">{c.programName}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      aria-label={`Status-${c.status}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] ${STATUS_STYLES[c.status] ?? "bg-surface-container-high text-on-surface-variant"}`}
                    >
                      <Hourglass size={14} aria-hidden="true" />
                      <span>{statusKey ? t(`dietWizard.${statusKey}`) : c.status}</span>
                    </span>
                    {c.pricePaid != null && (
                      <span className="text-[11px] text-on-surface-variant font-data-metric">
                        {String(c.pricePaid)} {t("dietCurrency")}
                      </span>
                    )}
                    <span className="text-[11px] text-on-surface-variant">{orgLabel}</span>
                  </div>
                </div>
                <PendingLink
                  href={resumeHref}
                  aria-label={c.status === "pending" || c.status === "paid" ? "Resume" : "ViewDetail"}
                  busyLabel={ts("loading")}
                  className="shrink-0 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all"
                >
                  <span>{resumeLabel}</span>
                </PendingLink>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
