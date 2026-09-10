import { Suspense } from "react";
import Link from "next/link";
import { PendingLink } from "@/components/clinical/pending-link";
import { getTranslations } from "next-intl/server";
import { CalendarClock, Plus } from "lucide-react";
import { requireUser } from "@/contexts/identity/actions";
import { myAppointments } from "@/contexts/booking/queries";
import ReservationsClient, { type ReservationRow } from "./reservations-client";

type ParamsProp = Promise<{ locale?: string }> | { locale?: string } | undefined;

async function resolveLocale(params: ParamsProp): Promise<string> {
  if (!params) return "fa";
  if (typeof (params as Promise<unknown>).then === "function") {
    try {
      const resolved = await (params as Promise<{ locale?: string }>);
      return resolved?.locale ?? "fa";
    } catch {
      return "fa";
    }
  }
  return (params as { locale?: string }).locale ?? "fa";
}

export default async function ProfileReservationsPage({
  params,
}: {
  params?: ParamsProp;
} = {}) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("account.reservations");
  const ts = await getTranslations("states");
  const dir = locale === "en" ? "ltr" : "rtl";

  const user = await requireUser();
  const appointments = await myAppointments(user.id);
  // Normalize to plain JSON for the client leaf (Date -> ISO string).
  const rows: ReservationRow[] = appointments.map((a) => ({
    id: a.id,
    status: a.status,
    paymentStatus: a.paymentStatus ?? null,
    partySize: a.partySize ?? null,
    price: a.price,
    patientName: a.patientName ?? null,
    patientPhone: a.patientPhone ?? null,
    serviceName: a.serviceName,
    startsAt: a.startsAt instanceof Date ? a.startsAt.toISOString() : String(a.startsAt),
  }));

  return (
    <div
      className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      dir={dir}
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">{t("myAppointments")}</span>
        </div>

        {/* Header Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface flex items-center gap-2">
            <CalendarClock size={26} className="text-primary" aria-hidden="true" />
            <span>{t("headerTitle")}</span>
          </h1>
          <PendingLink
            href={`/${locale}/booking/doctors`}
            busyLabel={ts("loading")}
            className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={16} aria-hidden="true" />
            <span>{t("newBooking")}</span>
          </PendingLink>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col gap-4" aria-hidden="true">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 animate-pulse"
                >
                  <div className="h-4 w-1/3 rounded bg-surface-container-high" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-surface-container-high" />
                </div>
              ))}
            </div>
          }
        >
          <ReservationsClient rows={rows} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
