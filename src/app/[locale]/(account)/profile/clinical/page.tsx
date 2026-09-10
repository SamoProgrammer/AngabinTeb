"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PendingLink } from "@/components/clinical/pending-link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleUserRound,
  CloudUpload,
  Info,
  Printer,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { formatJalaliDate } from "@/lib/format";
import { submitRegistry } from "@/contexts/identity/actions";

export default function ClinicalRegistryFormPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const t = useTranslations("account.registryForm");
  const tReg = useTranslations("account.registry");
  const ts = useTranslations("states");
  const stageTitles = t.raw("stageTitles") as string[];
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) => (locale === "en" ? String(n) : toPersianDigits(n));
  const localizeStage = (st: number | string) => (locale === "en" ? String(st) : toPersianDigits(st));

  const [currentStage, setCurrentStage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedDossier, setSubmittedDossier] = useState<{
    id: string;
    submittedAt: string;
  } | null>(null);

  // Form State across all 8 stages (empty defaults; persisted to the
  // clinical_registry row on final submit — no mock seed data).
  const [formData, setFormData] = useState({
    // Stage 1: Person Info & Biometrics
    fullName: "",
    nationalId: "",
    gender: "male",
    age: "",
    height: "",
    weight: "",
    maritalStatus: "single",
    occupation: "",
    emergencyPhone: "",

    // Stage 2: Chronic Medical History
    hasDiabetes: false,
    hasHypertension: false,
    hasFattyLiver: false,
    fattyLiverGrade: "1",
    hasThyroid: false,
    hasHeartDisease: false,
    hasKidneyDisease: false,
    medicalNotes: "",

    // Stage 3: Surgical History
    hadSurgery: false,
    surgeries: "",
    hadBariatricSurgery: false,
    hospitalizations: "",

    // Stage 4: Drug Profile
    currentDrugs: "",
    hasAllergies: false,
    allergies: "",
    supplements: "",

    // Stage 5: Nutrition Habits
    dailyMeals: "3",
    nightCravings: false,
    cravingType: "sweet", // sweet | salty | fatty
    waterIntakeGlasses: "",
    fastFoodPerWeek: "",
    smoking: false,

    // Stage 6: Physical Activity
    sittingHours: "",
    sportsPerWeek: "",
    sportsType: "",
    jointPain: false,

    // Stage 7: Lab Tests
    fbs: "",
    hba1c: "",
    cholesterol: "",
    triglycerides: "",
    alt: "",
    ast: "",
    creatinine: "",
    vitaminD: "",
    tsh: "",
    labFileName: "",
  });

  const updateField = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNext = () => {
    if (currentStage < 8) {
      setCurrentStage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStage > 1) {
      setCurrentStage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitFinal = async () => {
    setBusy(true);
    setSubmitError(null);
    try {
      const res = await submitRegistry({ ...formData });
      // Diet-wizard loop (?return=/diet/check?claim=…): skip the receipt and
      // send the user back to the check step, which re-freezes the snapshot.
      const rawReturn = new URLSearchParams(window.location.search).get("return");
      if (rawReturn && rawReturn.startsWith("/") && !rawReturn.startsWith("//")) {
        router.push(`/${locale}${rawReturn}`);
        return;
      }
      setSubmittedDossier({
        id: res.id,
        submittedAt: formatJalaliDate(new Date(), locale),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(t("submitting"));
    } finally {
      setBusy(false);
    }
  };

  // If dossier is submitted, render confirmation screen
  if (submittedDossier) {
    return (
      <div className="flex flex-col w-full bg-surface min-h-screen py-10 px-4 sm:px-6 lg:px-8" dir={dir}>
        <div className="max-w-2xl mx-auto w-full bg-surface-container-lowest p-8 rounded-3xl shadow-tier-2 border border-outline-variant/30 text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <BadgeCheck size={40} aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
              {t("dossierRegistered")}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-3">
              {t("dossierSuccessTitle")}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              {t("dossierSuccessDesc")}
            </p>
          </div>

          <div className="w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 flex flex-col gap-3 text-xs text-start">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">{t("ehrLabel")}</span>
              <span className="font-mono font-bold text-primary text-sm">
                {submittedDossier.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">{t("patientName")}</span>
              <span className="font-bold text-on-surface">{formData.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">{t("nationalId")}</span>
              <span className="font-mono text-on-surface">{fmt(formData.nationalId)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">{t("regDate")}</span>
              <span className="text-on-surface">{fmt(submittedDossier.submittedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">{t("reviewStatus")}</span>
              <span className="text-secondary font-bold">{t("pendingReview")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <PendingLink
              href={`/${locale}/profile/personal-info`}
              busyLabel={ts("loading")}
              className="w-full sm:flex-1 bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <CircleUserRound size={18} aria-hidden="true" />
              <span>{t("viewProfile")}</span>
            </PendingLink>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-surface-container-high hover:bg-surface-container text-on-surface py-3 px-5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={18} aria-hidden="true" />
              <span>{t("printDossier")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/profile/clinical`} className="hover:text-primary transition-colors">
            {t("registry")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("stageBreadcrumb", { stage: localizeStage(currentStage), title: stageTitles[Number(currentStage) - 1] })}
          </span>
        </div>

        {/* Folded from the old /registry overview on relocation (Task 6a) */}
        <p className="text-xs text-on-surface-variant leading-relaxed">{tReg("description")}</p>

        {/* 8-Stage Progress Stepper */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-3xl shadow-tier-1 border border-outline-variant/30 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[620px] gap-2">
            {stageTitles.map((title, idx) => {
              const stageNum = idx + 1;
              const isPassed = stageNum < currentStage;
              const isCurrent = stageNum === currentStage;
              return (
                <button
                  key={stageNum}
                  type="button"
                  onClick={() => setCurrentStage(stageNum)}
                  className={`flex flex-col items-center gap-1.5 transition-all flex-1 text-center ${
                    isCurrent
                      ? "text-primary font-bold scale-105"
                      : isPassed
                      ? "text-primary/80 font-medium"
                      : "text-on-surface-variant/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-primary text-on-primary shadow-sm ring-4 ring-primary/20"
                        : isPassed
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-container-high text-on-surface-variant/60"
                    }`}
                  >
                    {isPassed ? "✓" : fmt(stageNum)}
                  </div>
                  <span className="text-[10px] truncate max-w-[80px] leading-tight">
                    {title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Body Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-2 border border-outline-variant/30 text-start">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
            <div>
              <span className="text-[11px] text-primary font-bold">
                {t("stageOf", { stage: localizeStage(currentStage) })}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface mt-0.5">
                {stageTitles[currentStage - 1]}
              </h2>
            </div>
            <span className="text-xs bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full">
              {t("draftId", { draft: t("draftNew") })}
            </span>
          </div>

          {/* STAGE 1: Person Info & Biometrics */}
          {currentStage === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("fullName")}</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("nationalIdTen")}</label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.nationalId}
                  onChange={(e) => updateField("nationalId", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("age")}</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("gender")}</label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                >
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("height")}</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("weight")}</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("maritalStatus")}</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => updateField("maritalStatus", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                >
                  <option value="single">{t("single")}</option>
                  <option value="married">{t("married")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("emergencyPhone")}</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.emergencyPhone}
                  onChange={(e) => updateField("emergencyPhone", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
                />
              </div>
            </div>
          )}

          {/* STAGE 2: Chronic Illness History */}
          {currentStage === 2 && (
            <div className="flex flex-col gap-4 text-xs">
              <span className="font-bold text-on-surface">
                {t("stage2Header")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasDiabetes}
                    onChange={(e) => updateField("hasDiabetes", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{t("diabetes")}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasHypertension}
                    onChange={(e) => updateField("hasHypertension", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{t("hypertension")}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasFattyLiver}
                    onChange={(e) => updateField("hasFattyLiver", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{t("fattyLiver")}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasThyroid}
                    onChange={(e) => updateField("hasThyroid", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{t("thyroid")}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasHeartDisease}
                    onChange={(e) => updateField("hasHeartDisease", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{t("heartDisease")}</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasKidneyDisease}
                    onChange={(e) => updateField("hasKidneyDisease", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{t("kidneyDisease")}</span>
                </label>
              </div>

              {formData.hasFattyLiver && (
                <div className="flex items-center gap-3 p-3 bg-secondary-container/20 rounded-xl">
                  <span className="font-bold text-secondary">{t("fattyLiverGrade")}</span>
                  <div className="flex gap-4">
                    {["1", "2", "3"].map((g) => (
                      <label key={g} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="fattyLiverGrade"
                          checked={formData.fattyLiverGrade === g}
                          onChange={() => updateField("fattyLiverGrade", g)}
                          className="accent-secondary"
                        />
                        <span>{t("grade", { grade: localizeStage(g) })}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="font-bold text-on-surface">{t("medicalNotes")}</label>
                <textarea
                  rows={3}
                  value={formData.medicalNotes}
                  onChange={(e) => updateField("medicalNotes", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>
            </div>
          )}

          {/* STAGE 3: Surgical History */}
          {currentStage === 3 && (
            <div className="flex flex-col gap-4 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hadSurgery}
                  onChange={(e) => updateField("hadSurgery", e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="font-bold">{t("hadSurgery")}</span>
              </label>

              {formData.hadSurgery && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface">{t("surgeries")}</label>
                  <input
                    type="text"
                    value={formData.surgeries}
                    onChange={(e) => updateField("surgeries", e.target.value)}
                    className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                  />
                </div>
              )}

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hadBariatricSurgery}
                  onChange={(e) => updateField("hadBariatricSurgery", e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="font-bold">{t("hadBariatricSurgery")}</span>
              </label>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("hospitalizations")}</label>
                <textarea
                  rows={3}
                  value={formData.hospitalizations}
                  onChange={(e) => updateField("hospitalizations", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>
            </div>
          )}

          {/* STAGE 4: Drug Profile */}
          {currentStage === 4 && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("currentDrugs")}</label>
                <textarea
                  rows={3}
                  value={formData.currentDrugs}
                  onChange={(e) => updateField("currentDrugs", e.target.value)}
                  placeholder={t("drugPlaceholder")}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("supplements")}</label>
                <input
                  type="text"
                  value={formData.supplements}
                  onChange={(e) => updateField("supplements", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("allergies")}</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>
            </div>
          )}

          {/* STAGE 5: Nutrition & Appetite Habits */}
          {currentStage === 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("dailyMeals")}</label>
                <select
                  value={formData.dailyMeals}
                  onChange={(e) => updateField("dailyMeals", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                >
                  <option value="1">{t("meal1")}</option>
                  <option value="2">{t("meal2")}</option>
                  <option value="3">{t("meal3")}</option>
                  <option value="4">{t("meal4")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("waterIntake")}</label>
                <input
                  type="number"
                  value={formData.waterIntakeGlasses}
                  onChange={(e) => updateField("waterIntakeGlasses", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="font-bold text-on-surface">{t("cravingTitle")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "sweet", label: t("cravingSweet") },
                    { id: "salty", label: t("cravingSalty") },
                    { id: "fatty", label: t("cravingFatty") },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => updateField("cravingType", c.id)}
                      className={`p-2.5 rounded-xl border font-bold transition-all ${
                        formData.cravingType === c.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant/30 bg-surface-container-low text-on-surface"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("fastFoodPerWeek")}</label>
                <input
                  type="number"
                  value={formData.fastFoodPerWeek}
                  onChange={(e) => updateField("fastFoodPerWeek", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.smoking}
                  onChange={(e) => updateField("smoking", e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="font-bold">{t("smoking")}</span>
              </div>
            </div>
          )}

          {/* STAGE 6: Physical Activity */}
          {currentStage === 6 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("sittingHours")}</label>
                <input
                  type="number"
                  value={formData.sittingHours}
                  onChange={(e) => updateField("sittingHours", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-on-surface">{t("sportsPerWeek")}</label>
                <input
                  type="number"
                  value={formData.sportsPerWeek}
                  onChange={(e) => updateField("sportsPerWeek", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="font-bold text-on-surface">{t("sportsType")}</label>
                <input
                  type="text"
                  value={formData.sportsType}
                  onChange={(e) => updateField("sportsType", e.target.value)}
                  className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.jointPain}
                  onChange={(e) => updateField("jointPain", e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="font-bold">{t("jointPain")}</span>
              </div>
            </div>
          )}

          {/* STAGE 7: Lab Biomarkers */}
          {currentStage === 7 && (
            <div className="flex flex-col gap-4 text-xs">
              <span className="font-bold text-on-surface">
                {t("labTitle")}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">{t("fbs")}</label>
                  <input
                    type="number"
                    value={formData.fbs}
                    onChange={(e) => updateField("fbs", e.target.value)}
                    className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/30 text-on-surface font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">{t("hba1c")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hba1c}
                    onChange={(e) => updateField("hba1c", e.target.value)}
                    className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/30 text-on-surface font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">{t("cholesterol")}</label>
                  <input
                    type="number"
                    value={formData.cholesterol}
                    onChange={(e) => updateField("cholesterol", e.target.value)}
                    className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/30 text-on-surface font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">{t("triglycerides")}</label>
                  <input
                    type="number"
                    value={formData.triglycerides}
                    onChange={(e) => updateField("triglycerides", e.target.value)}
                    className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/30 text-on-surface font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">{t("alt")}</label>
                  <input
                    type="number"
                    value={formData.alt}
                    onChange={(e) => updateField("alt", e.target.value)}
                    className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/30 text-on-surface font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">{t("vitaminD")}</label>
                  <input
                    type="number"
                    value={formData.vitaminD}
                    onChange={(e) => updateField("vitaminD", e.target.value)}
                    className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/30 text-on-surface font-mono"
                  />
                </div>
              </div>

              {/* Lab Document Upload Box */}
              <div className="p-4 rounded-2xl bg-surface-container-low border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-center gap-2 mt-2">
                <CloudUpload size={32} className="text-primary" aria-hidden="true" />
                <span className="font-bold text-on-surface">{t("uploadTitle")}</span>
                <span className="text-[11px] text-on-surface-variant">
                  {t("uploadSub")}
                </span>
                <label className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-xs mt-1 cursor-pointer">
                  {t("chooseLabFile")}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => updateField("labFileName", e.target.files?.[0]?.name ?? "")}
                  />
                </label>
                {formData.labFileName && (
                  <span className="text-[11px] font-bold text-primary">{formData.labFileName}</span>
                )}
              </div>
            </div>
          )}

          {/* STAGE 8: Review & Final Submission */}
          {currentStage === 8 && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-start gap-2.5 text-primary">
                <Info size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  {t("stage8Notice")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3.5 rounded-xl">
                  <span className="text-[11px] text-on-surface-variant block mb-1">{t("reviewBiometrics")}</span>
                  <span className="font-bold text-on-surface block">{formData.fullName} ({fmt(formData.age)} {t("yearsOld")})</span>
                  <span className="text-on-surface-variant">{t("heightLabel")} {fmt(formData.height)} {t("heightUnit")} · {t("weightLabel")} {fmt(formData.weight)} {t("weightUnit")}</span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl">
                  <span className="text-[11px] text-on-surface-variant block mb-1">{t("reviewChronic")}</span>
                  <span className="font-bold text-on-surface block">
                    {formData.hasDiabetes ? t("reviewDiabetes") : ""}
                    {formData.hasFattyLiver ? t("reviewFattyLiver", { grade: localizeStage(formData.fattyLiverGrade) }) : ""}
                  </span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl">
                  <span className="text-[11px] text-on-surface-variant block mb-1">{t("reviewDrugs")}</span>
                  <span className="text-on-surface block truncate">{formData.currentDrugs}</span>
                  <span className="text-error font-medium">{formData.allergies}</span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl">
                  <span className="text-[11px] text-on-surface-variant block mb-1">{t("reviewBiomarkers")}</span>
                  <span className="font-bold text-primary block">
                    FBS: {formData.fbs} · HbA1c: {formData.hba1c}% · Vit D: {formData.vitaminD}
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 cursor-pointer mt-2">
                <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                <span className="font-medium text-on-surface">
                  {t("reviewConsent")}
                </span>
              </label>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col gap-3 pt-6 border-t border-outline-variant/20 mt-6">
            {submitError && (
              <p role="alert" className="text-xs font-bold text-error">
                {submitError}
              </p>
            )}
          <div className="flex items-center justify-between">
            {currentStage > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs py-2.5 px-6 rounded-xl transition-colors"
              >
                {t("prevStage")}
              </button>
            ) : (
              <span />
            )}

            {currentStage < 8 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>{t("nextStage", { title: stageTitles[currentStage] })}</span>
                {locale === "en" ? (
                  <ArrowRight size={16} aria-hidden="true" />
                ) : (
                  <ArrowLeft size={16} aria-hidden="true" />
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleSubmitFinal}
                className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>{t("submitting")}</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={18} aria-hidden="true" />
                    <span>{t("finalSubmit")}</span>
                  </>
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
