"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import {
  upsertSchedule,
  deleteSchedule,
  upsertException,
  deleteException,
} from "@/contexts/catalog/actions";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";

// Saturday-first display order for fa.
const DISPLAY_ORDER = [6, 0, 1, 2, 3, 4, 5];
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export interface ScheduleTabProps {
  providerId: string;
  services: { id: string; name: string }[];
  initialServiceId: string;
  schedules: {
    id: string;
    serviceId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    capacity: number;
    isActive: boolean;
  }[];
  exceptions: {
    id: string;
    serviceId: string | null;
    exceptionDate: string;
    isClosed: boolean;
    reason: string | null;
  }[];
  locale: string;
}

export function ScheduleTab({
  providerId,
  services,
  initialServiceId,
  schedules,
  exceptions,
  locale,
}: ScheduleTabProps) {
  const t = useTranslations("admin.scheduling");
  const tc = useTranslations("common");
  const router = useRouter();
  const [serviceId, setServiceId] = useState(
    initialServiceId || services[0]?.id || "",
  );

  const [saveState, saveAction, savePending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      const sid = String(formData.get("serviceId") ?? "");
      for (const wd of ALL_WEEKDAYS) {
        const rowId = String(formData.get(`sid-${wd}`) ?? "");
        const prevStart = String(formData.get(`prev-start-${wd}`) ?? "");
        const active = formData.get(`active-${wd}`) === "1";
        const start = String(formData.get(`start-${wd}`) ?? "");
        const end = String(formData.get(`end-${wd}`) ?? "");
        const duration = Number(formData.get(`duration-${wd}`) ?? 30);
        const capacity = Number(formData.get(`capacity-${wd}`) ?? 1);
        if (rowId && (!active || start !== prevStart)) {
          await deleteSchedule(rowId);
        }
        if (active && start && end) {
          const r = await upsertSchedule({
            providerId,
            serviceId: sid,
            weekday: wd,
            startTime: start,
            endTime: end,
            durationMinutes: duration,
            capacity,
            isActive: true,
          });
          if (!r.ok) return { ok: false, error: "invalid_schedule" };
        }
      }
      router.refresh();
      return { ok: true };
    },
    null,
  );

  const [excState, excAction, excPending] = useActionState(
    async (_prev: { ok: boolean } | null, formData: FormData) => {
      const r = await upsertException({
        providerId,
        date: String(formData.get("date") ?? ""),
        reason: String(formData.get("reason") ?? "") || undefined,
      });
      if (r.ok) router.refresh();
      return r;
    },
    null,
  );

  const byWeekday = new Map(
    schedules.filter((s) => s.serviceId === serviceId).map((s) => [s.weekday, s]),
  );

  return (
    <div className="flex flex-col gap-6">
      <form
        key={serviceId}
        action={saveAction}
        className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-tier-1"
      >
        <input type="hidden" name="serviceId" value={serviceId} />
        <div className="mb-4 flex flex-col gap-1 text-start">
          <label htmlFor="schedule-service" className="text-xs font-bold text-on-surface">
            {t("tabs.schedules")}
          </label>
          <select
            id="schedule-service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="rounded-xl bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <ul className="flex flex-col gap-3">
          {DISPLAY_ORDER.map((wd) => {
            const row = byWeekday.get(wd);
            return (
              <li
                key={wd}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low px-3 py-3"
              >
                <input type="hidden" name={`sid-${wd}`} value={row?.id ?? ""} />
                <input type="hidden" name={`prev-start-${wd}`} value={row?.startTime ?? ""} />
                <label className="flex min-w-28 cursor-pointer items-center gap-2 text-start text-sm font-bold text-on-surface">
                  <input
                    type="checkbox"
                    name={`active-${wd}`}
                    value="1"
                    defaultChecked={row?.isActive ?? wd < 5}
                    className="h-4 w-4 accent-primary"
                  />
                  {t(`weekdays.${wd}`)}
                </label>
                <input
                  type="time"
                  name={`start-${wd}`}
                  defaultValue={row?.startTime ?? "09:00"}
                  aria-label={`${t(`weekdays.${wd}`)} start`}
                  className="rounded-lg bg-surface-container-lowest px-2 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="time"
                  name={`end-${wd}`}
                  defaultValue={row?.endTime ?? "13:00"}
                  aria-label={`${t(`weekdays.${wd}`)} end`}
                  className="rounded-lg bg-surface-container-lowest px-2 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="number"
                  name={`duration-${wd}`}
                  defaultValue={row?.durationMinutes ?? 30}
                  min={5}
                  step={5}
                  aria-label="duration"
                  className="w-20 rounded-lg bg-surface-container-lowest px-2 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="number"
                  name={`capacity-${wd}`}
                  defaultValue={row?.capacity ?? 1}
                  min={1}
                  aria-label="capacity"
                  className="w-20 rounded-lg bg-surface-container-lowest px-2 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                />
              </li>
            );
          })}
        </ul>

        <button
          type="submit"
          disabled={savePending || !serviceId}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary transition-all hover:bg-primary-container disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {t("saveSchedules")}
        </button>
        {saveState && !saveState.ok && (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {saveState.error}
          </p>
        )}
      </form>

      <form
        action={excAction}
        className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-tier-1"
      >
        <h2 className="mb-4 text-sm font-bold text-on-surface">{t("exceptionsTitle")}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 text-start">
            <JalaliDatePicker locale={locale} name="date" />
          </div>
          <div className="flex flex-1 flex-col gap-1 text-start">
            <input
              type="text"
              name="reason"
              maxLength={200}
              placeholder={t("exceptionsTitle")}
              className="rounded-xl bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            disabled={excPending}
            className="rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
          >
            {tc("save")}
          </button>
        </div>
        {excState && !excState.ok && (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {"error" in excState ? String(excState.error) : "error"}
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-2">
          {exceptions.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface"
            >
              <span>
                {e.exceptionDate}
                {e.reason ? ` — ${e.reason}` : ""}
              </span>
              <button
                type="button"
                aria-label={t("deleteSlot")}
                onClick={async () => {
                  await deleteException(e.id);
                  router.refresh();
                }}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-red-700"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
}
