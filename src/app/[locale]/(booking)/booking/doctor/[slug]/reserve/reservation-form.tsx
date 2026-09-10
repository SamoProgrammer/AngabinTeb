"use client";

import { useState } from "react";
import Link from "next/link";
import { PendingLink } from "@/components/clinical/pending-link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  Clock,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { formatJalaliDate, formatJalaliTime, formatJalaliWeekday, toPersianDigits } from "@/lib/format";
import { bookAppointment } from "@/contexts/booking/actions";
import { useActionFeedback } from "@/components/clinical/use-action-feedback";

interface SlotData {
  id: string;
  startsAt: string;
  capacity: number;
  bookedCount: number;
}

interface DoctorReservationFormProps {
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorSlug: string;
  serviceId: string;
  serviceName: string;
  initialDate: string;
  slots: SlotData[];
  locale?: string;
}

export function DoctorReservationForm({
  doctorId: _doctorId,
  doctorName: _doctorName,
  doctorSpecialty: _doctorSpecialty,
  doctorSlug,
  serviceId,
  serviceName: _serviceName,
  initialDate,
  slots,
  locale = "fa",
}: DoctorReservationFormProps) {
  const t = useTranslations("booking");
  const ts = useTranslations("states");
  const router = useRouter();
  const digits = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  // Generate 7 days for the schedule selector. Day switches navigate with
  // ?date= so the server refetches real availability for the chosen day.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const iso = d.toISOString().slice(0, 10);
    const dayName = formatJalaliWeekday(d, locale, "short");
    const dateLabel = formatJalaliDate(d, locale, {
      month: "short",
      day: "numeric",
    });

    return {
      iso,
      dayName,
      dateLabel,
    };
  });

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Form Fields
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [notes, setNotes] = useState("");

  // Status
  const { pending: busy, error, run, setError } = useActionFeedback();

  const morningSlots = slots.filter((s) => {
    const h = new Date(s.startsAt).getUTCHours();
    return h < 13;
  });

  const eveningSlots = slots.filter((s) => {
    const h = new Date(s.startsAt).getUTCHours();
    return h >= 13;
  });

  const labels = {
    errorSlot: t("reservation.errorSlot"),
    errorName: t("reservation.errorName"),
    errorPhone: t("reservation.errorPhone"),
    capacityError: t("slotCapacityError"),
    genericError: t("slotGenericError"),
    serverError: t("slotServerError"),
    emptyTitle: t("slotEmptyTitle"),
    emptyHint: t("slotEmptyHint"),
    step1: t("reservation.step1"),
    step2: t("reservation.step2"),
    morningShifts: t("reservation.morningShifts"),
    eveningShifts: t("reservation.eveningShifts"),
    full: t("reservation.full"),
    available: t("reservation.available"),
    step3: t("reservation.step3"),
    patientFullName: t("reservation.patientFullName"),
    namePlaceholder: t("reservation.namePh"),
    mobilePhone: t("reservation.mobilePhone"),
    nationalId: t("reservation.nationalId"),
    reasonForVisit: t("reservation.reason"),
    reasonPlaceholder: t("reservation.reasonPh"),
    cancelReturn: t("reservation.cancelReturn"),
    processing: t("reservation.processing"),
    confirmCta: t("confirm"),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) {
      setError(labels.errorSlot);
      return;
    }
    if (!patientName.trim()) {
      setError(labels.errorName);
      return;
    }
    if (!phoneNumber.trim()) {
      setError(labels.errorPhone);
      return;
    }

    run(
      () =>
        bookAppointment({
          serviceId,
          slotId: selectedSlotId,
          partySize: 1,
          patientName: patientName.trim(),
          patientPhone: phoneNumber.trim(),
          notes:
            [notes.trim(), nationalId.trim() ? `nationalId: ${nationalId.trim()}` : ""]
              .filter(Boolean)
              .join(" | ") || undefined,
          idempotencyKey: crypto.randomUUID(),
        }) as Promise<{ ok: boolean; appointmentId?: string; reason?: string }>,
      {
        successKey: "successBooked",
        onOk: (res) => {
          if ("appointmentId" in res && res.appointmentId)
            router.push(`/${locale}/confirm?id=${res.appointmentId}`);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. Date Selector Carousel (links refetch real slots per day) */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-3">
        <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" aria-hidden="true" />
          <span>{labels.step1}</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {days.map((d) => {
            const isSelected = initialDate === d.iso;
            return (
              <PendingLink
                key={d.iso}
                href={`/${locale}/booking/doctor/${doctorSlug}/reserve?date=${d.iso}`}
                aria-current={isSelected ? "date" : undefined}
                busyLabel={ts("loading")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-sm scale-[1.02]"
                    : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container"
                }`}
              >
                <span className="text-[11px] font-bold">{d.dayName}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? "text-on-primary/80" : "text-on-surface-variant"}`}>
                  {d.dateLabel}
                </span>
              </PendingLink>
            );
          })}
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-on-surface">{labels.emptyTitle}</p>
          <p className="text-xs text-on-surface-variant">{labels.emptyHint}</p>
        </div>
      ) : (
        <>
          {/* 2. Morning & Evening Slot Selector */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
            <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
              <Clock size={18} className="text-primary" aria-hidden="true" />
              <span>{labels.step2}</span>
            </label>

            {/* Morning Shifts */}
            {morningSlots.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                  <Sun size={16} className="text-amber-500" aria-hidden="true" />
                  <span>{labels.morningShifts}</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {morningSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isFull = slot.capacity - slot.bookedCount <= 0;
                    const timeStr = formatJalaliTime(slot.startsAt, locale, {
                      hour12: false,
                    });
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          isFull
                            ? "opacity-50 cursor-not-allowed bg-surface-container-low border-outline-variant/20 text-on-surface-variant"
                            : isSelected
                            ? "bg-primary text-on-primary border-primary shadow-sm font-bold"
                            : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:border-primary/50"
                        }`}
                      >
                        <span className="font-mono">{digits(timeStr)}</span>
                        <span className="text-[10px]">
                          {isFull ? labels.full : labels.available}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evening Shifts */}
            {eveningSlots.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                  <Moon size={16} className="text-indigo-500" aria-hidden="true" />
                  <span>{labels.eveningShifts}</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {eveningSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isFull = slot.capacity - slot.bookedCount <= 0;
                    const timeStr = formatJalaliTime(slot.startsAt, locale, {
                      hour12: false,
                    });
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          isFull
                            ? "opacity-50 cursor-not-allowed bg-surface-container-low border-outline-variant/20 text-on-surface-variant"
                            : isSelected
                            ? "bg-primary text-on-primary border-primary shadow-sm font-bold"
                            : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:border-primary/50"
                        }`}
                      >
                        <span className="font-mono">{digits(timeStr)}</span>
                        <span className="text-[10px]">
                          {isFull ? labels.full : labels.available}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Patient Information Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
            <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
              <User size={18} className="text-primary" aria-hidden="true" />
              <span>{labels.step3}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">
                  {labels.patientFullName}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={labels.namePlaceholder}
                  className="w-full bg-surface-container-low text-on-surface text-xs py-2.5 px-3.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">
                  {labels.mobilePhone}
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={digits("09123456789")}
                  dir="ltr"
                  className="w-full bg-surface-container-low text-on-surface text-xs py-2.5 px-3.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30 text-start"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">
                  {labels.nationalId}
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder={digits("0012345678")}
                  dir="ltr"
                  className="w-full bg-surface-container-low text-on-surface text-xs py-2.5 px-3.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30 text-start"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">
                  {labels.reasonForVisit}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={labels.reasonPlaceholder}
                  className="w-full bg-surface-container-low text-on-surface text-xs py-2.5 px-3.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
              <CircleAlert size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <Link
              href={`/${locale}/booking/doctors`}
              className="text-xs text-on-surface-variant hover:text-primary font-medium"
            >
              {labels.cancelReturn}
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>{labels.processing}</span>
                </>
              ) : (
                <>
                  <BadgeCheck size={18} aria-hidden="true" />
                  <span>{labels.confirmCta}</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
