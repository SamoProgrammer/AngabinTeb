"use client";

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  FlaskConical,
  HousePlus,
  Send,
  Siren,
  Stethoscope,
  Terminal,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const SECTOR_IDS = [
  "physicians",
  "nutritionists",
  "clinics",
  "laboratories",
  "nursing-home",
  "ambulance-fleets",
  "medical-informatics",
];

const SECTOR_ICONS: LucideIcon[] = [
  Stethoscope,
  Utensils,
  Building2,
  FlaskConical,
  HousePlus,
  Siren,
  Terminal,
];

interface Sector {
  title: string;
  description: string;
  requirements: string;
}

export default function WorkWithUsPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const resolvedParams = params ? use(params) : { locale: "fa" };
  const locale = resolvedParams.locale;
  const t = useTranslations("work");
  const sectors = t.raw("sectors") as Sector[];
  const isRtl = locale !== "en";

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    nationalCode: "",
    medicalCode: "",
    sector: "physicians",
    city: "",
    resumeSummary: "",
  });
  const [busy, setBusy] = useState(false);
  const [submittedTracking, setSubmittedTracking] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSubmittedTracking("B2B-" + Math.floor(100000 + Math.random() * 900000));
    }, 1200);
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {/* Header Hero */}
        <section className="text-center flex flex-col items-center gap-3 max-w-3xl mx-auto">
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {t("heroBadge")}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </section>

        {/* 7 Sectors Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sec, idx) => (
            <div
              key={SECTOR_IDS[idx] ?? idx}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-tier-1 flex flex-col justify-between text-start"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shrink-0">
                  {(() => {
                    const SectorIcon = SECTOR_ICONS[idx] ?? Briefcase;
                    return <SectorIcon size={28} aria-hidden="true" />;
                  })()}
                </div>
                <h2 className="text-base font-bold text-on-surface mb-2">{sec.title}</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  {sec.description}
                </p>
              </div>
              <div className="pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                <strong className="text-on-surface block mb-0.5">{t("reqTitle")}</strong>
                <span>{sec.requirements}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Application Form Card */}
        <section className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-tier-2 text-start max-w-3xl mx-auto w-full">
          <div className="mb-6 pb-4 border-b border-outline-variant/20">
            <h2 className="text-lg font-bold text-on-surface">{t("formTitle")}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{t("formSubtitle")}</p>
          </div>

          {submittedTracking ? (
            <div className="p-8 bg-primary/10 rounded-2xl border border-primary/20 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <BadgeCheck size={36} aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-primary">{t("successTitle")}</h3>
              <p className="text-xs text-on-surface-variant max-w-md">
                {t("trackingText")}{" "}
                <strong className="font-mono text-primary text-sm">{submittedTracking}</strong>
              </p>
              <span className="text-xs text-on-surface-variant max-w-md leading-relaxed">
                {t("evalNotice")}
              </span>
              <button
                onClick={() => setSubmittedTracking(null)}
                className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                {t("anotherBtn")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("fullNameLabel")}</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("phoneLabel")}</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("sectorLabel")}</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface cursor-pointer"
                  >
                    {sectors.map((s, idx) => (
                      <option key={SECTOR_IDS[idx] ?? idx} value={SECTOR_IDS[idx] ?? idx}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("medicalCodeLabel")}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.medicalCode}
                    onChange={(e) => setFormData({ ...formData, medicalCode: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("cityLabel")}</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t("cityPlaceholder")}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("nationalCodeLabel")}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.nationalCode}
                    onChange={(e) => setFormData({ ...formData, nationalCode: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-bold text-on-surface">{t("resumeLabel")}</label>
                  <textarea
                    rows={4}
                    value={formData.resumeSummary}
                    onChange={(e) => setFormData({ ...formData, resumeSummary: e.target.value })}
                    placeholder={t("resumePlaceholder")}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {busy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>{t("submittingText")}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} aria-hidden="true" />
                      <span>{t("submitBtn")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
