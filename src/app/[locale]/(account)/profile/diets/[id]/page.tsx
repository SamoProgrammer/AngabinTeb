import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dietDocuments } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { myDietClaims } from "@/contexts/nutrition/queries";
import { generateProgramDocument } from "@/contexts/nutrition/actions";
import PrintButton from "./print-button";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  CircleDashed,
  LifeBuoy,
  RotateCcw,
  Snowflake,
} from "lucide-react";

const TIMELINE = ["pending", "paid", "generating", "needs_review", "ready", "failed"] as const;

const STATUS_KEYS: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  generating: "statusGenerating",
  needs_review: "statusNeedsReview",
  ready: "statusReady",
  failed: "statusFailed",
};

export default async function ProfileDietDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await requireUser();
  const { locale, id } = await params;
  const t = await getTranslations("nutrition");
  const dir = locale === "en" ? "ltr" : "rtl";
  const BackIcon = locale === "en" ? ArrowLeft : ArrowRight;

  // Ownership check via the user's own claim registry — no separate query.
  const claims = await myDietClaims(user.id, locale);
  const claim = claims.find((c) => c.claimId === id);
  if (!claim) notFound();

  const [document] = claim.hasDocument
    ? await db.select().from(dietDocuments).where(eq(dietDocuments.claimId, claim.claimId))
    : [];
  const statusKey = STATUS_KEYS[claim.status];
  // failed branches off after generating; otherwise progress is linear.
  const reached = (s: string) =>
    claim.status === "failed"
      ? ["pending", "paid", "generating", "failed"].includes(s)
      : TIMELINE.indexOf(s as (typeof TIMELINE)[number]) <=
        TIMELINE.indexOf(claim.status as (typeof TIMELINE)[number]);

  return (
    <div className="flex flex-col gap-6 text-start" dir={dir}>
      <Link
        href={`/${locale}/profile/diets`}
        aria-label="BackToDiets"
        className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <BackIcon size={16} aria-hidden="true" />
        <span>{t("dietWizard.detailBack")}</span>
      </Link>

      <section
        aria-label="ClaimDetail"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-extrabold text-on-surface">{claim.programName}</h1>
          <span
            aria-label={`Status-${claim.status}`}
            className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full"
          >
            {statusKey ? t(`dietWizard.${statusKey}`) : claim.status}
          </span>
        </div>

        {claim.status !== "pending" && (
          <p
            aria-label="FrozenBanner"
            className="flex items-start gap-2 text-[11px] sm:text-xs text-on-surface-variant bg-surface-container-low rounded-2xl p-4 leading-relaxed"
          >
            <Snowflake size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span>{t("dietWizard.frozenBanner")}</span>
          </p>
        )}

        <div aria-label="ClaimTimeline" className="flex flex-col gap-1">
          <h2 className="text-xs font-bold text-on-surface-variant mb-1">
            {t("dietWizard.timelineTitle")}
          </h2>
          {TIMELINE.map((s) => {
            const done = reached(s);
            const current = s === claim.status;
            const key = STATUS_KEYS[s];
            return (
              <div key={s} className="flex items-center gap-2 py-1">
                {done ? (
                  <CircleCheckBig
                    size={18}
                    className={current ? "text-primary" : "text-primary/50"}
                    aria-hidden="true"
                  />
                ) : (
                  <CircleDashed size={18} className="text-on-surface-variant/40" aria-hidden="true" />
                )}
                <span
                  className={`text-xs sm:text-sm ${current ? "font-extrabold text-on-surface" : done ? "font-medium text-on-surface" : "text-on-surface-variant/60"}`}
                >
                  {t(`dietWizard.${key}`)}
                </span>
              </div>
            );
          })}
        </div>

        {claim.status === "pending" && (
          <Link
            href={`/${locale}/diet/payment?claim=${claim.claimId}`}
            aria-label="ResumePayment"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all"
          >
            <span>{t("dietWizard.resumePayment")}</span>
          </Link>
        )}
        {claim.status === "paid" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-on-surface-variant leading-relaxed">{t("dietWizard.paidNote")}</p>
            <Link
              href={`/${locale}/diet/check?claim=${claim.claimId}`}
              aria-label="ResumeCheck"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all"
            >
              <span>{t("dietWizard.resumeCheck")}</span>
            </Link>
          </div>
        )}

        {claim.status === "ready" && document && (
          <section aria-label="DietDocument" className="flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
              {t("dietDocTitle")}
            </h2>
            <div className="whitespace-pre-wrap text-xs sm:text-sm text-on-surface bg-surface-container-low rounded-2xl p-5 leading-loose">
              {document.bodyMarkdown}
            </div>
            <PrintButton label={t("dietDocPrint")} />
          </section>
        )}

        {claim.status === "generating" && (
          <form
            action={async () => {
              "use server";
              await generateProgramDocument(claim.claimId);
              revalidatePath(`/${locale}/profile/diets/${claim.claimId}`);
            }}
          >
            <button
              type="submit"
              aria-label="Retry"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all"
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span>{t("dietDocRetry")}</span>
            </button>
          </form>
        )}

        {claim.status === "failed" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t("dietWizard.failedNote")}
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t("dietWizard.failedAdminNote")}
            </p>
            <Link
              href={`/${locale}/support`}
              aria-label="ContactSupport"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all"
            >
              <LifeBuoy size={18} aria-hidden="true" />
              <span>{t("dietWizard.supportCta")}</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
