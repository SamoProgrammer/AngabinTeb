import { Suspense } from "react";
import { PendingLink } from "@/components/clinical/pending-link";
import { UserPageHeader } from "@/components/account/user-page-header";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
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
        <UserPageHeader
          locale={locale}
          title={t("headerTitle")}
          action={
            <PendingLink
              href={`/${locale}/booking/doctors`}
              busyLabel={ts("loading")}
              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} aria-hidden="true" />
              <span>{t("newBooking")}</span>
            </PendingLink>
          }
        />

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
