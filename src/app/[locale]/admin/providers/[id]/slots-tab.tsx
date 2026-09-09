"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  generateSlotsFromSchedules,
  toggleSlotActive,
  deleteSlot,
} from "@/contexts/catalog/actions";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";

export interface SlotsTabProps {
  providerId: string;
  services: { id: string; name: string }[];
  initialServiceId: string;
  date: string;
  slots: {
    id: string;
    startsAt: string;
    capacity: number;
    bookedCount: number;
    isActive: boolean;
  }[];
  locale: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

export function SlotsTab({
  providerId,
  services,
  initialServiceId,
  date,
  slots,
  locale,
}: SlotsTabProps) {
  const t = useTranslations("admin.scheduling");
  const router = useRouter();
  const [serviceId, setServiceId] = useState(initialServiceId || services[0]?.id || "");
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(plusDaysIso(30));
  const [filterService, setFilterService] = useState(initialServiceId);
  const [pending, setPending] = useState(false);

  function goto(nextDate: string, nextService: string) {
    const params = new URLSearchParams({ tab: "slots", date: nextDate });
    if (nextService) params.set("serviceId", nextService);
    router.push(`/${locale}/admin/providers/${providerId}?${params.toString()}`);
  }
  const [result, setResult] = useState<{ created: number; overlap: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  async function generate() {
    if (!serviceId) return;
    setPending(true);
    setResult(null);
    setError(null);
    const r = await generateSlotsFromSchedules({
      providerId,
      serviceId,
      fromDate,
      toDate,
    });
    setPending(false);
    if (r.ok) {
      setResult({ created: r.count, overlap: r.overlap });
      router.refresh();
    } else {
      setError("error" in r && r.error ? String(r.error) : t("overlapMessage"));
    }
  }

  async function setActive(id: string, isActive: boolean) {
    await toggleSlotActive(id, isActive);
    router.refresh();
  }

  async function remove(id: string) {
    await deleteSlot(id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-tier-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 text-start">
            <JalaliDatePicker locale={locale} value={fromDate} onChange={setFromDate} />
          </div>
          <div className="flex flex-col gap-1 text-start">
            <JalaliDatePicker locale={locale} value={toDate} onChange={setToDate} />
          </div>
          <div className="flex flex-1 flex-col gap-1 text-start">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              aria-label={t("tabs.slots")}
              className="rounded-xl bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={pending || !serviceId}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-all hover:bg-primary-container disabled:opacity-50"
          >
            {t("generateSlots")}
          </button>
        </div>
        {result && (
          <p className="mt-3 text-xs font-medium text-on-surface">
            {t("createdCount", { count: fmt(result.created) })}
            {result.overlap > 0 ? ` ${t("overlapCount", { count: fmt(result.overlap) })}` : ""}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-tier-1 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1 text-start">
          <JalaliDatePicker
            locale={locale}
            value={date}
            onChange={(next) => goto(next, filterService)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 text-start">
          <select
            value={filterService}
            onChange={(e) => {
              setFilterService(e.target.value);
              goto(date, e.target.value);
            }}
            aria-label={t("tabs.slots")}
            className="rounded-xl bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">{t("tabs.slots")}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {slots.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-lowest px-4 py-3 shadow-tier-1"
          >
            <span className="text-sm font-bold text-on-surface">
              {formatJalaliDateTime(s.startsAt, locale)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                !s.isActive
                  ? "bg-red-100 text-red-700"
                  : s.bookedCount > 0
                    ? "bg-secondary/10 text-secondary"
                    : "bg-primary/10 text-primary"
              }`}
            >
              {fmt(s.bookedCount)}/{fmt(s.capacity)}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => setActive(s.id, !s.isActive)}
                className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                {s.isActive ? t("blockSlot") : t("unblockSlot")}
              </button>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-surface-container-high"
              >
                {t("deleteSlot")}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
