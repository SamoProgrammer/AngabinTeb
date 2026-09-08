import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ClipboardList, Fingerprint, Play } from "lucide-react";

export default async function RegistryOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("account.registry");
  const stages = t.raw("stages") as string[];
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("breadcrumb")}
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl shadow-tier-2 border border-outline-variant/30 text-start">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                {t("badge")}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                {t("title")}
              </h1>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ClipboardList size={36} aria-hidden="true" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
            {t("description")}
          </p>

          {/* 8 Stages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {stages.map((stageTitle, idx) => {
              const stNum = idx + 1;
              return (
                <div
                  key={stNum}
                  className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {stNum}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">
                      {stageTitle}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {t("stageLabel", { num: stNum })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy & Guarantee Notice */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-3 mb-8 text-xs text-on-surface-variant">
            <Fingerprint size={22} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              {t("privacy")}
            </p>
          </div>

          {/* Start Button */}
          <div className="flex items-center justify-end">
            <Link
              href={`/${locale}/registry/form/new`}
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-bold text-sm py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={20} aria-hidden="true" />
              <span>{t("startCta")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
