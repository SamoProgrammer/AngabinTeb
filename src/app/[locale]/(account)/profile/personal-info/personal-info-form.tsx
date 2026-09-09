"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CircleCheckBig, Save, User } from "lucide-react";
import { updateProfile } from "@/contexts/identity/actions";

export default function PersonalInfoForm({
  initial,
  phone,
}: {
  initial: { name: string; nationalId: string; fatherName: string; gender: string };
  phone: string;
}) {
  const t = useTranslations("account.personalInfo");

  const [formData, setFormData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSavedSuccess(false);
    setError(null);
    const res = await updateProfile({
      name: formData.name,
      nationalId: formData.nationalId || undefined,
      fatherName: formData.fatherName || undefined,
      gender: (formData.gender === "female" ? "female" : "male") as "male" | "female",
    });
    setBusy(false);
    if (!res.ok) {
      setError("error" in res ? res.error : t("successMsg"));
      if ("error" in res) toast.error(res.error, { duration: 4000 });
      return;
    }
    setSavedSuccess(true);
    toast.success(t("successMsg"), { duration: 2500 });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-on-surface">{t("fullName")}</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-on-surface">{t("nationalId")}</label>
          <input
            type="text"
            dir="ltr"
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
            className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-start font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-on-surface">{t("fatherName")}</label>
          <input
            type="text"
            value={formData.fatherName}
            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
            className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-on-surface">{t("gender")}</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-on-surface"
          >
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="font-bold text-on-surface">{t("phone")}</label>
          <input
            type="tel"
            readOnly
            dir="ltr"
            value={phone}
            className="bg-surface-container-high/60 p-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant text-start font-mono cursor-not-allowed"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="p-3 bg-error/10 border border-error/20 text-error rounded-xl font-bold">
          {error}
        </p>
      )}

      {savedSuccess && (
        <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold flex items-center gap-2">
          <CircleCheckBig size={18} aria-hidden="true" />
          <span>{t("successMsg")}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/20">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <User size={20} aria-hidden="true" />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ms-auto"
        >
          {busy ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save size={18} aria-hidden="true" />
              <span>{t("saveChanges")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
