"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/contexts/booking/actions";
import { useTranslations } from "next-intl";
import { toPersianDigits, formatPrice } from "@/lib/format";
import { ArrowLeft, ArrowRight, CalendarX, Clock, Moon, Sunrise, User } from "lucide-react";

export type SlotProps = {
  id: string;
  startsAt: string;
  capacity: number;
  bookedCount: number;
  providerId?: string;
  providerName?: string;
};

type Result = { ok: boolean; appointmentId?: string; reason?: string };

export interface SlotPickerProps {
  slots: SlotProps[];
  serviceId: string;
  locale?: string;
  price?: number | string | null;
}

export function SlotPicker({
  slots,
  serviceId,
  locale = "fa",
  price = 250000,
}: SlotPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const t = useTranslations("booking");
  const isEn = locale === "en";
  const dir = isEn ? "ltr" : "rtl";
  const ForwardIcon = isEn ? ArrowRight : ArrowLeft;

  if (slots.length === 0) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-surface-container-low text-center border border-outline-variant/20 flex flex-col items-center gap-3" dir={dir}>
        <CalendarX size={32} className="text-on-surface-variant/60" aria-hidden="true" />
        <p className="text-sm font-bold text-on-surface">
          {t("slotEmptyTitle")}
        </p>
        <p className="text-xs text-on-surface-variant">
          {t("slotEmptyHint")}
        </p>
      </div>
    );
  }

  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const key = crypto.randomUUID();
    try {
      const res = (await bookAppointment({
        serviceId,
        slotId: selected,
        partySize: 1,
        patientName: patientName.trim() || undefined,
        patientPhone: phoneNumber.trim() || undefined,
        notes: notes || undefined,
        idempotencyKey: key,
      })) as Result;

      if (res.ok && res.appointmentId) {
        router.push(`/${locale}/confirm?id=${res.appointmentId}`);
      } else {
        setError(
          res.reason === "capacity_exceeded"
            ? t("slotCapacityError")
            : t("slotGenericError"),
        );
        setBusy(false);
      }
    } catch {
      setError(t("slotServerError"));
      setBusy(false);
    }
  }

  const morningSlots = (list: SlotProps[]) =>
    list.filter((s) => new Date(s.startsAt).getUTCHours() < 12);
  const eveningSlots = (list: SlotProps[]) =>
    list.filter((s) => new Date(s.startsAt).getUTCHours() >= 12);

  // Group by doctor, preserving first-seen order. Single unnamed group
  // renders exactly like before (no header) so doctor pages are untouched.
  const groups: { key: string; name?: string; slots: SlotProps[] }[] = [];
  {
    const byKey = new Map<string, (typeof groups)[number]>();
    for (const s of slots) {
      const key = s.providerId ?? "__single__";
      let g = byKey.get(key);
      if (!g) {
        g = { key, name: s.providerName, slots: [] };
        byKey.set(key, g);
        groups.push(g);
      }
      g.slots.push(s);
    }
  }
  const showHeaders = groups.length > 1 || Boolean(groups[0]?.name);

  const renderSlot = (s: SlotProps) => {
    const dateObj = new Date(s.startsAt);
    const rawHour = String(dateObj.getUTCHours()).padStart(2, "0");
    const rawMinute = String(dateObj.getUTCMinutes()).padStart(2, "0");
    const timeEng = `${rawHour}:${rawMinute}`;
    const timeDisplay = isEn ? timeEng : toPersianDigits(timeEng);

    const remaining = Math.max(0, s.capacity - s.bookedCount);
    const isFull = remaining <= 0;
    const isSelected = selected === s.id;

    const remainingLabel = isFull
      ? t("slotFull")
      : remaining === 1
      ? t("slotLimited")
      : t("slotRemaining", {
          count: isEn ? String(remaining) : toPersianDigits(remaining),
        });

    return (
      <li key={s.id}>
        <button
          type="button"
          disabled={isFull || busy}
          onClick={() => setSelected(s.id)}
          aria-pressed={isSelected}
          aria-label={timeEng}
          className={`w-full p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
            isFull
              ? "bg-surface-container-low text-on-surface-variant/40 border-outline-variant/20 cursor-not-allowed line-through"
              : isSelected
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/40"
                : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-primary/40 hover:bg-surface-container"
          }`}
        >
          <span className="text-sm font-bold">{timeDisplay}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              isFull
                ? "bg-transparent text-outline"
                : remaining === 1
                  ? "bg-secondary/10 text-secondary font-bold"
                  : "bg-primary/10 text-primary font-medium"
            }`}
          >
            {remainingLabel}
          </span>
        </button>
      </li>
    );
  };

  const slotsCountLabel = t("slotsCount", {
    count: isEn ? String(slots.length) : toPersianDigits(slots.length),
  });

  return (
    <div className="mt-6 flex flex-col gap-6" dir={dir}>
      {/* Time Slots Section */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
            <Clock size={20} className="text-primary" aria-hidden="true" />
            <span>{t("selectTime")}</span>
          </h3>
          <span className="text-xs text-on-surface-variant">
            {slotsCountLabel}
          </span>
        </div>

        {groups.map((g) => {
          const morning = morningSlots(g.slots);
          const evening = eveningSlots(g.slots);
          return (
            <div key={g.key} className="flex flex-col gap-2">
              {showHeaders && g.name && (
                <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <User size={16} className="text-primary" aria-hidden="true" />
                  <span>{g.name}</span>
                </span>
              )}
              {morning.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Sunrise size={16} className="text-amber-600" aria-hidden="true" />
                    <span>{t("morningShift")}</span>
                  </span>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {morning.map(renderSlot)}
                  </ul>
                </div>
              )}

              {evening.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Moon size={16} className="text-primary" aria-hidden="true" />
                    <span>{t("eveningShift")}</span>
                  </span>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {evening.map(renderSlot)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Patient Information Form (Screen #8) */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
        <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
          <User size={20} className="text-primary" aria-hidden="true" />
          <span>{t("patientInfo")}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-start">
            <label htmlFor="patient_name" className="text-xs font-bold text-on-surface">
              {t("patientName")}
            </label>
            <input
              id="patient_name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={t("patientNamePh")}
              className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="flex flex-col gap-1 text-start">
            <label htmlFor="phone_number" className="text-xs font-bold text-on-surface">
              {t("patientPhone")}
            </label>
            <input
              id="phone_number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t("patientPhonePh")}
              dir="ltr"
              className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface text-start outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="flex flex-col gap-1 text-start sm:col-span-2">
            <label htmlFor="symptoms_note" className="text-xs font-bold text-on-surface">
              {t("visitReason")}
            </label>
            <input
              id="symptoms_note"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("visitReasonPh")}
              className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>
      </div>

      {/* Reassurance & Confirmation Strip */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col text-start">
          <span className="text-xs sm:text-sm font-bold text-on-surface">
            {t("tariff", { price: formatPrice(price, locale) })}
          </span>
          <span className="text-xs text-primary font-medium mt-0.5">
            {t("payNote")}
          </span>
        </div>

        <button
          type="button"
          disabled={!selected || busy}
          onClick={confirm}
          aria-label={t("confirmAria")}
          className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span className="sr-only">Confirm booking</span>
          {busy ? (
            <span>{t("bookingBusy")}</span>
          ) : (
            <>
              <span>{t("confirm")}</span>
              <ForwardIcon size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className="p-3 bg-red-50 text-red-700 text-xs sm:text-sm rounded-xl border border-red-200 text-center">
          {error}
        </p>
      )}
    </div>
  );
}