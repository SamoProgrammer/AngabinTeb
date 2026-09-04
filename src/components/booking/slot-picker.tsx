"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/contexts/booking/actions";
import { toPersianDigits, formatPrice } from "@/components/catalog/doctor-card";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export type SlotProps = {
  id: string;
  startsAt: string;
  capacity: number;
  bookedCount: number;
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

  if (slots.length === 0) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-surface-container-low text-center border border-outline-variant/20 flex flex-col items-center gap-3">
        <ClinicalIcon name="event_busy" size={32} className="text-on-surface-variant/60" />
        <p className="text-sm font-bold text-on-surface">
          در این تاریخ نوبت خالی وجود ندارد.
        </p>
        <p className="text-xs text-on-surface-variant">
          لطفاً روز دیگری را برای مراجعه انتخاب فرمایید یا با پذیرش کلینیک تماس حاصل فرمایید.
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
        notes: notes ? `${patientName ? patientName + " - " : ""}${notes}` : patientName || undefined,
        idempotencyKey: key,
      })) as Result;

      if (res.ok && res.appointmentId) {
        router.push(`/${locale}/confirm?id=${res.appointmentId}`);
      } else {
        setError(
          res.reason === "capacity_exceeded"
            ? "این نوبت لحظاتی پیش توسط مراجع دیگری رزرو شد. لطفاً زمان دیگری را انتخاب فرمایید."
            : "ثبت نوبت با خطا مواجه شد. لطفاً مجدداً تلاش نمایید.",
        );
        setBusy(false);
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش نمایید.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6" dir="rtl">
      {/* Time Slots Section */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
            <ClinicalIcon name="schedule" size={20} className="text-primary" />
            <span>انتخاب ساعت حضور</span>
          </h3>
          <span className="text-xs text-on-surface-variant">
            {toPersianDigits(slots.length)} نوبت در دسترس
          </span>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((s) => {
            const dateObj = new Date(s.startsAt);
            const rawHour = String(dateObj.getUTCHours()).padStart(2, "0");
            const rawMinute = String(dateObj.getUTCMinutes()).padStart(2, "0");
            const timeEng = `${rawHour}:${rawMinute}`;
            const timeDisplay = toPersianDigits(timeEng);

            const remaining = Math.max(0, s.capacity - s.bookedCount);
            const isFull = remaining <= 0;
            const isSelected = selected === s.id;

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
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isFull
                        ? "bg-transparent text-outline"
                        : remaining === 1
                          ? "bg-secondary/10 text-secondary font-bold"
                          : "bg-primary/10 text-primary font-medium"
                    }`}
                  >
                    {isFull
                      ? "پر شد"
                      : remaining === 1
                        ? "ظرفیت محدود"
                        : `${toPersianDigits(remaining)} نوبت آزاد`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Patient Information Form (Screen #8) */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
        <h3 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
          <ClinicalIcon name="person" size={20} className="text-primary" />
          <span>اطلاعات بیمار</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-right">
            <label htmlFor="patient_name" className="text-xs font-bold text-on-surface">
              نام و نام خانوادگی بیمار
            </label>
            <input
              id="patient_name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="مثلاً: سارا محمدی"
              className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="flex flex-col gap-1 text-right">
            <label htmlFor="phone_number" className="text-xs font-bold text-on-surface">
              شماره تماس همراه (جهت پیامک نوبت)
            </label>
            <input
              id="phone_number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              dir="ltr"
              className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface text-right outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="flex flex-col gap-1 text-right sm:col-span-2">
            <label htmlFor="symptoms_note" className="text-xs font-bold text-on-surface">
              توضیحات یا علت مراجعه (اختیاری)
            </label>
            <input
              id="symptoms_note"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="خلاصه علائم یا دلیل ویزیت..."
              className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>
      </div>

      {/* Reassurance & Confirmation Strip */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col text-right">
          <span className="text-xs sm:text-sm font-bold text-on-surface">
            هزینه مصوب: {formatPrice(price)}
          </span>
          <span className="text-xs text-primary font-medium mt-0.5">
            پرداخت در محل مطب / بدون کارمزد آنلاین
          </span>
        </div>

        <button
          type="button"
          disabled={!selected || busy}
          onClick={confirm}
          aria-label="Confirm booking"
          className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          {busy ? (
            <span>در حال پردازش نوبت...</span>
          ) : (
            <>
              <span>ثبت و تایید نهایی نوبت</span>
              <ClinicalIcon name="arrow_left" size={18} />
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