"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Banknote,
  CalendarDays,
  CalendarX,
  Pin,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { formatJalaliDateTime, formatPrice, toPersianDigits } from "@/lib/format";
import { cancelAppointment } from "@/contexts/booking/actions";
import { useActionFeedback } from "@/components/clinical/use-action-feedback";

// Plain-JSON projection of myAppointments() rows (server serializes
// startsAt to ISO in page.tsx so the leaf stays serializable).
export interface ReservationRow {
  id: string;
  status: string;
  paymentStatus: string | null;
  partySize: number | null;
  price: string | number;
  patientName: string | null;
  patientPhone: string | null;
  serviceName: string;
  startsAt: string;
}

export default function ReservationsClient({
  rows,
  locale,
}: {
  rows: ReservationRow[];
  locale: string;
}) {
  const t = useTranslations("account.reservations");
  const [items, setItems] = useState<ReservationRow[]>(rows);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { pending, error: actionError, run, setError } = useActionFeedback();

  const localizeDigits = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);
  const formatDateTime = (iso: string) => {
    try {
      return formatJalaliDateTime(iso, locale);
    } catch {
      return iso;
    }
  };

  // Business rule mirror of canCancel(): only `confirmed` is cancellable.
  const upcomingList = items.filter((r) => r.status === "confirmed");
  const pastList = items.filter((r) => r.status !== "confirmed");

  const statusLabel = (status: string) => {
    if (status === "confirmed") return t("confirmed");
    if (status === "cancelled") return t("cancelledStatus");
    return t("completedStatus");
  };

  const handleConfirmCancel = () => {
    if (!cancellingId || pending) return;
    const id = cancellingId;
    run(() => cancelAppointment(id), {
      successKey: "successCancelled",
      onOk: () => {
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
        );
        setCancellingId(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "upcoming"
              ? "bg-surface-container-lowest text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span>{t("upcomingTab")}</span>
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center">
            {localizeDigits(upcomingList.length)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "history"
              ? "bg-surface-container-lowest text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span>{t("historyTab")}</span>
          <span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant text-[10px] flex items-center justify-center">
            {localizeDigits(pastList.length)}
          </span>
        </button>
      </div>

      {/* Upcoming Tab */}
      {activeTab === "upcoming" && (
        <div className="flex flex-col gap-4">
          {upcomingList.length === 0 ? (
            <div className="bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant/30 text-center">
              <CalendarX
                size={48}
                className="text-on-surface-variant/40 mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-bold text-on-surface mb-1">{t("noActive")}</p>
              <p className="text-xs text-on-surface-variant mb-4">{t("noActiveSub")}</p>
              <Link
                href={`/${locale}/booking/doctors`}
                className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl"
              >
                {t("searchDoctors")}
              </Link>
            </div>
          ) : (
            upcomingList.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-6 rounded-3xl shadow-tier-1 border border-outline-variant/30 flex flex-col justify-between gap-4 text-start"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Stethoscope size={26} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        {item.serviceName}
                      </h3>
                      {item.patientName && (
                        <p className="text-xs text-primary font-medium">{item.patientName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {t("confirmed")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-2">
                    <CalendarDays
                      size={18}
                      className="text-primary shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">
                        {t("dateTimeLabel")}
                      </span>
                      <span className="font-bold text-on-surface">
                        {formatDateTime(item.startsAt)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-2">
                    <Pin size={18} className="text-primary shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">
                        {t("trackingLabel")}
                      </span>
                      <span className="font-mono font-bold text-primary">
                        #{item.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-2">
                    <Banknote size={18} className="text-primary shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">
                        {t("depositLabel")}
                      </span>
                      <span className="font-bold text-on-surface">
                        {formatPrice(item.price, locale)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                  <span className="text-[11px] text-on-surface-variant">
                    {t("remainderNotice")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingId(item.id);
                      setError(null);
                    }}
                    className="text-xs text-error hover:bg-error/10 px-3 py-1.5 rounded-xl font-bold transition-colors"
                  >
                    {t("cancelBtn")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          {pastList.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between text-start text-xs opacity-80"
            >
              <div>
                <h4 className="text-sm font-bold text-on-surface">{item.serviceName}</h4>
                <p className="text-on-surface-variant mt-0.5">
                  {formatDateTime(item.startsAt)}
                </p>
              </div>
              <div className="text-end">
                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    item.status === "cancelled"
                      ? "bg-error/10 text-error"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {statusLabel(item.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-tier-3 border border-outline-variant/30 max-w-md w-full text-start flex flex-col gap-4">
            <div className="flex items-center gap-3 text-error">
              <TriangleAlert size={28} aria-hidden="true" />
              <h3 className="text-base font-bold text-on-surface">{t("modalTitle")}</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t("modalDesc")}
            </p>
            {actionError && (
              <p role="alert" className="text-xs font-bold text-error">
                {actionError}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setCancellingId(null);
                  setError(null);
                }}
                className="bg-surface-container-high hover:bg-surface-container text-on-surface px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {t("modalCancel")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleConfirmCancel}
                className="bg-error hover:bg-error/90 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {t("modalConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
