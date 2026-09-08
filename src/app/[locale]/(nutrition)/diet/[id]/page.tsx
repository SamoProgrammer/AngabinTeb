import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/contexts/identity/actions";
import { getProgramContent } from "@/contexts/nutrition/queries";
import { isPricedProgram } from "@/contexts/nutrition/kernel";
import { formatPersianNumber, toPersianDigits } from "@/lib/metabolism";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleCheckBig,
  Download,
  FilePenLine,
  Lock,
  Stethoscope,
  Utensils,
} from "lucide-react";

export default async function DietDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await requireUser();
  const { locale, id } = await params;
  // Server-side claim gate lives inside getProgramContent: unclaimed callers
  // get downloadUrl: null, so the file can never leak through this page.
  const content = await getProgramContent(id, user.id, locale);
  if (!content) notFound();

  const t = await getTranslations("nutrition");
  const durationText = (days: number) =>
    t("dietDetailDuration", { days: locale === "en" ? String(days) : toPersianDigits(days) });
  const formatPrice = (v: number | string) =>
    locale === "en" ? Number(v).toLocaleString("en-US") : formatPersianNumber(Number(v));
  const formatPhone = (v: string) => (locale === "en" ? v : toPersianDigits(v));
  const BackIcon = locale === "en" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col gap-6 text-start" dir={locale === "en" ? "ltr" : "rtl"}>
      <Link
        href=".."
        aria-label="BackToDiet"
        className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <BackIcon size={16} aria-hidden="true" />
        <span>{t("dietDetailBack")}</span>
      </Link>

      <section
        aria-label="ProgramDetail"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {content.planType || t("dietDetailDefaultPlanType")}
          </span>
          <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">
            {durationText(content.durationDays)}
          </span>
          {content.hasClaim && (
            <span
              aria-label="Owned"
              className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1"
            >
              <BadgeCheck size={14} aria-hidden="true" />
              <span>{t("dietDetailOwned")}</span>
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
          {content.name}
        </h1>
        {content.description && (
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {content.description}
          </p>
        )}
        {content.practitionerName && (
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <Stethoscope size={16} className="text-primary" aria-hidden="true" />
            <span>
              {t("dietDetailPractitioner")} {content.practitionerName}
              {content.practitionerPhone &&
                ` • ${t("dietDetailPhonePrefix")} ${formatPhone(content.practitionerPhone)}`}
            </span>
          </p>
        )}

        {content.accessDenied ? (
          <div
            aria-label="AccessDenied"
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-3"
          >
            <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900">
              <Lock size={20} aria-hidden="true" />
              <span>{t("dietDetailClaimRequired")}</span>
            </p>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              {t("dietDetailFeeLabel")}{" "}
              <strong className="font-data-metric">
                {formatPrice(content.price)} {t("dietDetailCurrency")}
              </strong>
              . {t("dietDetailClaimExpl")}
            </p>
            <Link
              href={`../?context=${content.organizationContext}&claim=${content.id}`}
              aria-label="Claim"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <CircleCheckBig size={18} aria-hidden="true" />
              <span>{t("dietDetailClaimBtn")}</span>
            </Link>
          </div>
        ) : (
          <div aria-label="ProgramAccess" className="flex flex-col gap-3">
            {content.downloadUrl ? (
              <a
                href={content.downloadUrl}
                aria-label="Download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all"
              >
                <Download size={18} aria-hidden="true" />
                <span>{t("dietDetailDownloadBtn")}</span>
              </a>
            ) : (
              <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-2xl p-4 leading-relaxed">
                {t("dietDetailNoFileNotice")}
              </p>
            )}
            {!content.hasClaim && !isPricedProgram(content.price) && (
              <Link
                href={`../?context=${content.organizationContext}&claim=${content.id}`}
                aria-label="Claim"
                className="text-xs font-bold text-primary hover:underline self-start"
              >
                <span>{t("dietDetailClaimForRecords")}</span>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Next Steps: Connect to Daily Tracker */}
      <section className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Utensils size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">{t("dietDetailDiaryTitle")}</h3>
            <p className="text-xs text-on-surface-variant">{t("dietDetailDiaryDesc")}</p>
          </div>
        </div>
        <Link
          href={`/${locale}/nutrition/diary`}
          className="bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
        >
          <FilePenLine size={16} aria-hidden="true" />
          <span>{t("dietDetailDiaryBtn")}</span>
        </Link>
      </section>
    </div>
  );
}
