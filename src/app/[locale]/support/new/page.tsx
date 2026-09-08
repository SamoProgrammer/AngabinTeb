import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { createSupportRequest } from "@/contexts/support/actions";
import { myAppointments } from "@/contexts/booking/queries";
import { formatJalaliDateTime } from "@/lib/format";
import { ArrowLeft, ArrowRight, CircleAlert, Headset, Send } from "lucide-react";

const KINDS = ["question", "complaint", "appointment_issue"] as const;

export default async function NewSupportRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { kind, error } = await searchParams;
  const user = await requireUser();
  const t = await getTranslations("support.new");
  const isRtl = locale !== "en";
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  const kindValue: (typeof KINDS)[number] = KINDS.includes(kind as (typeof KINDS)[number])
    ? (kind as (typeof KINDS)[number])
    : "question";

  const appointments = kindValue === "appointment_issue" ? await myAppointments(user.id) : [];

  async function submit(formData: FormData) {
    "use server";
    const result = await createSupportRequest({
      kind: kindValue,
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
      appointmentId: formData.get("appointmentId") ? String(formData.get("appointmentId")) : undefined,
    });
    if (!result.ok) {
      redirect(`/${locale}/support/new?kind=${kindValue}&error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/${locale}/support/requests`);
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href={`/${locale}/support`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline mb-6 text-start"
        >
          <ArrowIcon size={16} aria-hidden="true" />
          <span>{t("backLink")}</span>
        </Link>

        {/* Card Container */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 sm:p-8 shadow-xs text-start">
          <div className="flex items-center gap-2 text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-full w-fit mb-3">
            <Headset size={16} aria-hidden="true" />
            <span>{t(`kinds.${kindValue}`)}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
            {t(`kinds.${kindValue}`)}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t("subtitle")}
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs sm:text-sm text-destructive font-medium flex items-center gap-2">
              <CircleAlert size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form action={submit} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="support-subject" className="block text-xs sm:text-sm font-bold text-on-surface">
                {t("labels.subject")}
              </label>
              <input
                id="support-subject"
                name="subject"
                required
                minLength={3}
                maxLength={200}
                placeholder={t("labels.subjectPlaceholder")}
                className="block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="support-body" className="block text-xs sm:text-sm font-bold text-on-surface">
                {t("labels.body")}
              </label>
              <textarea
                id="support-body"
                name="body"
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                placeholder={t("labels.bodyPlaceholder")}
                className="block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline leading-relaxed"
              />
            </div>

            {kindValue === "appointment_issue" && (
              <div className="space-y-1.5">
                <label htmlFor="support-appointment" className="block text-xs sm:text-sm font-bold text-on-surface">
                  {t("labels.appointment")}
                </label>
                <select
                  id="support-appointment"
                  name="appointmentId"
                  required
                  className="block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">{t("labels.selectAppointment")}</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.serviceName} — {formatJalaliDateTime(a.startsAt, locale)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-xs hover:bg-primary-container transition-all cursor-pointer"
            >
              <Send size={18} aria-hidden="true" />
              <span>{t("labels.submit")}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}