"use client";

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import { CircleCheckBig, Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactUsPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const resolvedParams = params ? use(params) : { locale: "fa" };
  const locale = resolvedParams.locale;
  const t = useTranslations("contact");
  const isRtl = locale !== "en";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    department: "general",
    subject: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSuccess(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        department: "general",
        subject: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
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

        {/* Contact Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Phone size={24} aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-on-surface">{t("card1Title")}</h2>
            <p className="text-sm font-mono font-bold text-primary" dir="ltr">
              {t("card1Phone")}
            </p>
            <span className="text-[11px] text-on-surface-variant">{t("card1Hours")}</span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MapPin size={24} aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-on-surface">{t("card2Title")}</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t("card2Address")}
            </p>
            <span className="text-[11px] text-primary font-bold">{t("card2Postal")}</span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Mail size={24} aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-on-surface">{t("card3Title")}</h2>
            <p className="text-xs font-mono font-bold text-primary">info@angabinteb.com</p>
            <span className="text-[11px] text-on-surface-variant">{t("card3Desc")}</span>
          </div>
        </section>

        {/* Interactive Contact Form */}
        <section className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-tier-1 text-start max-w-3xl mx-auto w-full">
          <div className="mb-6 pb-4 border-b border-outline-variant/20">
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              {t("formTitle")}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t("formSubtitle")}
            </p>
          </div>

          {success ? (
            <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 text-center flex flex-col items-center gap-2">
              <CircleCheckBig size={36} className="text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-primary">{t("successTitle")}</h3>
              <p className="text-xs text-on-surface-variant">
                {t("successDesc")}
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-2 text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                {t("newMsgBtn")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("nameLabel")}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    placeholder={t("phonePlaceholder")}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("emailLabel")}</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("deptLabel")}</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface cursor-pointer"
                  >
                    <option value="general">{t("deptGeneral")}</option>
                    <option value="nutrition">{t("deptNutrition")}</option>
                    <option value="doctors">{t("deptDoctors")}</option>
                    <option value="technical">{t("deptTechnical")}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-bold text-on-surface">{t("subjectLabel")}</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t("subjectPlaceholder")}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-bold text-on-surface">{t("messageLabel")}</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t("messagePlaceholder")}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {busy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>{t("sendingText")}</span>
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
