"use client";

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, FileWarning, Search, Send } from "lucide-react";

export default function ComplainsPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const resolvedParams = params ? use(params) : { locale: "fa" };
  const locale = resolvedParams.locale;
  const t = useTranslations("complains");
  const isRtl = locale !== "en";

  const [activeTab, setActiveTab] = useState<"new" | "track">("new");

  // New Complaint Form State
  const [formData, setFormData] = useState({
    complainantName: "",
    phone: "",
    nationalCode: "",
    centerOrDoctor: "",
    appointmentCode: "",
    category: "tariff",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [issuedTrackingCode, setIssuedTrackingCode] = useState<string | null>(null);

  // Track Complaint State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResult, setTrackResult] = useState<{
    found: boolean;
    code?: string;
    status?: string;
    date?: string;
    response?: string;
  } | null>(null);

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setIssuedTrackingCode("CMP-" + Math.floor(100000 + Math.random() * 900000));
    }, 1000);
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackResult({
      found: true,
      code: trackQuery.trim(),
      status: t("demoStatus"),
      date: t("demoDate"),
      response: t("demoResponse"),
    });
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero */}
        <section className="text-center flex flex-col items-center gap-3 max-w-3xl mx-auto">
          <span className="bg-secondary-container/30 text-secondary text-xs font-bold px-3 py-1 rounded-full">
            {t("heroBadge")}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </section>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 w-fit mx-auto">
          <button
            onClick={() => {
              setActiveTab("new");
              setIssuedTrackingCode(null);
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "new"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <FileWarning size={18} aria-hidden="true" />
            <span>{t("tabNew")}</span>
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "track"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Search size={18} aria-hidden="true" />
            <span>{t("tabTrack")}</span>
          </button>
        </div>

        {/* Tab 1: New Complaint */}
        {activeTab === "new" && (
          <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-tier-2 text-start">
            {issuedTrackingCode ? (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <BadgeCheck size={36} aria-hidden="true" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-primary">
                  {t("successTitle")}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {t("trackingCodeLabel")}
                </p>
                <div className="bg-surface-container-low px-6 py-3 rounded-2xl border border-outline-variant/30 font-mono font-extrabold text-lg text-primary">
                  {issuedTrackingCode}
                </div>
                <p className="text-xs text-on-surface-variant max-w-md leading-relaxed mt-2">
                  {t("successNote")}
                </p>
                <button
                  onClick={() => setIssuedTrackingCode(null)}
                  className="mt-3 text-xs text-primary font-bold hover:underline"
                >
                  {t("fileAnotherBtn")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint} className="flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface">{t("complainantNameLabel")}</label>
                    <input
                      type="text"
                      required
                      value={formData.complainantName}
                      onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                      className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface">{t("phoneLabel")}</label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      placeholder={t("phonePlaceholder")}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
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

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface">{t("centerOrDoctorLabel")}</label>
                    <input
                      type="text"
                      required
                      value={formData.centerOrDoctor}
                      onChange={(e) => setFormData({ ...formData, centerOrDoctor: e.target.value })}
                      placeholder={t("centerOrDoctorPlaceholder")}
                      className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface">{t("categoryLabel")}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                    >
                      <option value="tariff">{t("catTariff")}</option>
                      <option value="misconduct">{t("catMisconduct")}</option>
                      <option value="delay">{t("catDelay")}</option>
                      <option value="ehr">{t("catEhr")}</option>
                      <option value="other">{t("catOther")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface">{t("appointmentCodeLabel")}</label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder={t("appointmentCodePlaceholder")}
                      value={formData.appointmentCode}
                      onChange={(e) => setFormData({ ...formData, appointmentCode: e.target.value })}
                      className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="font-bold text-on-surface">{t("descriptionLabel")}</label>
                    <textarea
                      rows={5}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t("descriptionPlaceholder")}
                      className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface leading-relaxed"
                    />
                  </div>
                </div>

                <div className="p-3 bg-secondary-container/20 border border-secondary/20 rounded-xl text-[11px] text-secondary">
                  {t("privacyNotice")}
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
          </div>
        )}

        {/* Tab 2: Track Complaint */}
        {activeTab === "track" && (
          <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-tier-2 text-start flex flex-col gap-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                {t("trackTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("trackSubtitle")}
              </p>
            </div>

            <form onSubmit={handleTrackSearch} className="flex items-center gap-2">
              <input
                type="text"
                required
                dir="ltr"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="CMP-..."
                className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-6 py-3 rounded-xl transition-colors shrink-0"
              >
                {t("trackBtn")}
              </button>
            </form>

            {trackResult && (
              <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">{t("trackIdLabel")}</span>
                  <span className="font-mono font-bold text-primary">{trackResult.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">{t("trackDateLabel")}</span>
                  <span>{trackResult.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">{t("trackStatusLabel")}</span>
                  <span className="font-bold text-secondary">{trackResult.status}</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-1">
                  <span className="font-bold text-on-surface">{t("trackResponseLabel")}</span>
                  <p className="text-on-surface-variant leading-relaxed text-[11px]">
                    {trackResult.response}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
