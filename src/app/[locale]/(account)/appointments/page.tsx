import Link from "next/link";
import { requireUser } from "@/contexts/identity/actions";
import { myAppointments } from "@/contexts/booking/queries";
import { cancelAppointment } from "@/contexts/booking/actions";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits } from "@/components/catalog/doctor-card";

export default async function AppointmentsPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const user = await requireUser();
  const rows = await myAppointments(user.id);
  const resolvedParams = params ? await params : {};
  const locale = resolvedParams.locale ?? "fa";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <ClinicalIcon name="check_circle" size={14} fill />
            <span>تایید شده</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-error/10 text-error px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <ClinicalIcon name="cancel" size={14} />
            <span>لغو شده</span>
          </span>
        );
      case "completed":
        return (
          <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <ClinicalIcon name="done_all" size={14} />
            <span>انجام شده</span>
          </span>
        );
      default:
        return (
          <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-start">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              نوبت‌های ویزیت و خدمات درمانی من
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              مشاهده سوابق رزرو، وضعیت حضور در مطب و مدیریت نوبت‌های بالینی
            </p>
          </div>

          <Link
            href={`/${locale}/services`}
            className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-primary-container transition-all self-start sm:self-auto"
          >
            <ClinicalIcon name="add" size={18} />
            <span>رزرو نوبت جدید</span>
          </Link>
        </div>

        {/* Appointments List (Screen #31) */}
        <div className="flex flex-col gap-4">
          {rows.map((a) => {
            const dateStr = new Intl.DateTimeFormat("fa-IR", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(new Date(a.startsAt));

            return (
              <div
                key={a.id}
                className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-1 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ClinicalIcon name="calendar_month" size={26} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-on-surface">
                        {a.serviceName}
                      </h2>
                      {getStatusBadge(a.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <ClinicalIcon name="schedule" size={15} className="text-primary" />
                        <span>{dateStr}</span>
                      </span>
                      {a.patientName ? (
                        <span className="flex items-center gap-1">
                          <ClinicalIcon name="person" size={15} className="text-primary" />
                          <span>{a.patientName}</span>
                        </span>
                      ) : null}
                      {a.patientPhone ? (
                        <span className="flex items-center gap-1">
                          <ClinicalIcon name="call" size={15} className="text-primary" />
                          <span dir="ltr">{a.patientPhone}</span>
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <ClinicalIcon name="group" size={15} className="text-primary" />
                        <span>تعداد مراجعین: {toPersianDigits(a.partySize)} نفر</span>
                      </span>
                      <span className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-md text-[11px] font-medium text-primary">
                        <ClinicalIcon name="payments" size={14} />
                        <span>پرداخت در مطب</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reschedule + Cancel Actions */}
                {a.status === "confirmed" && (
                  <div className="flex items-center gap-3 pt-2 sm:pt-0 self-end sm:self-center">
                    <Link
                      href={`/${locale}/appointments/${a.id}/reschedule`}
                      className="px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <ClinicalIcon name="event_repeat" size={16} />
                      <span>تغییر نوبت</span>
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await cancelAppointment(a.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/5 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <ClinicalIcon name="cancel" size={16} />
                        <span>لغو نوبت</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container text-outline flex items-center justify-center">
                <ClinicalIcon name="event_busy" size={36} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-base font-bold text-on-surface">شما هنوز هیچ نوبت فعالی ثبت نکرده‌اید</p>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  جهت دریافت مشاوره تخصصی یا انجام آزمایش‌های چکاپ، می‌توانید از بخش خدمات و پزشکان نوبت مورد نظر خود را رزرو کنید.
                </p>
              </div>
              <Link
                href={`/${locale}/services`}
                className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-container transition-all"
              >
                <ClinicalIcon name="calendar_today" size={18} />
                <span>مشاهده خدمات و رزرو نوبت</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}