"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarX, CircleCheck, UserX } from "lucide-react";
import {
  cancelAppointmentAsAdmin,
  completeAppointmentAsAdmin,
  markNoShowAsAdmin,
} from "@/contexts/booking/actions";
import { formatJalaliDateTime } from "@/lib/format";

export interface BookingsTabProps {
  bookings: {
    id: string;
    status: string;
    partySize: number;
    price: string | number | null;
    patientName: string | null;
    patientPhone: string | null;
    serviceName: string;
    startsAt: string | null;
  }[];
  locale: string;
}

export function BookingsTab({ bookings, locale }: BookingsTabProps) {
  const t = useTranslations("admin.bookings");
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, kind: "cancel" | "complete" | "noShow") {
    setBusyId(id);
    if (kind === "cancel") await cancelAppointmentAsAdmin(id);
    else if (kind === "complete") await completeAppointmentAsAdmin(id);
    else await markNoShowAsAdmin(id);
    setBusyId(null);
    router.refresh();
  }

  if (bookings.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
        {t("empty")}
      </p>
    );
  }

  const when = (iso: string | null) => (iso ? formatJalaliDateTime(iso, locale) : "—");

  const actions = (b: (typeof bookings)[number]) =>
    b.status !== "confirmed" ? null : (
      <span className="flex gap-2">
        <button
          type="button"
          disabled={busyId === b.id}
          onClick={() => act(b.id, "cancel")}
          className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-surface-container-high disabled:opacity-50"
        >
          <CalendarX size={14} aria-hidden="true" />
          {t("cancel")}
        </button>
        <button
          type="button"
          disabled={busyId === b.id}
          onClick={() => act(b.id, "complete")}
          className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-surface-container-high disabled:opacity-50"
        >
          <CircleCheck size={14} aria-hidden="true" />
          {t("complete")}
        </button>
        <button
          type="button"
          disabled={busyId === b.id}
          onClick={() => act(b.id, "noShow")}
          className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-50"
        >
          <UserX size={14} aria-hidden="true" />
          {t("noShow")}
        </button>
      </span>
    );

  return (
    <div>
      <ul className="flex flex-col gap-3 md:hidden">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="flex flex-col gap-2 rounded-2xl bg-surface-container-lowest p-4 text-start shadow-tier-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-on-surface">
                {b.patientName ?? "—"}
              </span>
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                {b.status}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant" dir="ltr">
              {b.patientPhone ?? "—"}
            </span>
            <span className="text-xs text-on-surface-variant">{b.serviceName}</span>
            <span className="text-xs font-medium text-on-surface">{when(b.startsAt)}</span>
            {actions(b)}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl bg-surface-container-lowest shadow-tier-1 md:block">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="text-xs text-on-surface-variant">
              <th className="px-4 py-3 text-start font-bold">{t("patient")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("phone")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("service")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("when")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("status")}</th>
              <th className="px-4 py-3 text-start font-bold" />
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-outline-variant/20">
                <td className="px-4 py-3 font-bold text-on-surface">{b.patientName ?? "—"}</td>
                <td className="px-4 py-3 text-on-surface-variant" dir="ltr">
                  {b.patientPhone ?? "—"}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{b.serviceName}</td>
                <td className="px-4 py-3 text-on-surface">{when(b.startsAt)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">{actions(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
