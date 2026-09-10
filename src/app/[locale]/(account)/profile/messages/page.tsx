import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { Send } from "lucide-react";
import { db } from "@/db";
import { clinicalMessages } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { listRequests } from "@/contexts/support/queries";
import { createSupportRequest, markMessagesRead } from "@/contexts/support/actions";
import { resolveIcon } from "@/components/clinical/icons";
import { PendingButton } from "@/components/clinical/pending-button";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";

export default async function ProfileMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("account.messages");
  const tNotif = await getTranslations("notifications");
  const tSupportForm = await getTranslations("support.new");
  const dir = locale === "en" ? "ltr" : "rtl";
  const localizeDigits = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  // Server-side session re-verification (layout also gates, defense in depth).
  const user = await requireUser();
  const [messages, requests] = await Promise.all([
    db
      .select()
      .from(clinicalMessages)
      .where(eq(clinicalMessages.recipientUserId, user.id))
      .orderBy(desc(clinicalMessages.sentAt))
      .limit(50),
    listRequests({ userId: user.id }),
  ]);
  const unread = messages.filter((m) => !m.isRead);

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">{t("title")}</span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">
            {t("inboxHeader")} · {t("threadsCount", { count: localizeDigits(messages.length) })}
          </h2>
          {unread.length > 0 && (
            <form action={markMessagesRead}>
              <PendingButton
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {tNotif("markAllRead")}
              </PendingButton>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Clinical inbox (real clinical_message rows) */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-4 rounded-3xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-3 text-start">
            {messages.map((m) => {
              const AvatarIcon = resolveIcon("stethoscope");
              const dateStr = formatJalaliDateTime(m.sentAt, locale);
              return (
                <article
                  key={m.id}
                  className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${
                    m.isRead
                      ? "bg-surface-container-low border-outline-variant/20"
                      : "bg-primary/10 border-primary shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <AvatarIcon size={18} aria-hidden="true" />
                      </div>
                      <span className="font-bold text-xs text-on-surface">{m.senderDoctorName}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">{dateStr}</span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{m.subject}</p>
                  <p className="text-xs text-on-surface leading-relaxed">{m.body}</p>
                  {m.attachmentUrl && (
                    <p className="text-[11px] text-on-surface-variant">
                      {t("attachmentLabel")}
                      {m.attachmentUrl}
                    </p>
                  )}
                  <span className="text-[11px] bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full self-start">
                    {t("officialBadge")}
                  </span>
                </article>
              );
            })}
            {messages.length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-8">{tNotif("emptyTitle")}</p>
            )}
          </div>

          {/* My support requests + new-message form (real support kernel) */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-3xl shadow-tier-2 border border-outline-variant/30 flex flex-col gap-4 text-start">
            <div className="flex flex-col gap-2">
              {requests.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs font-semibold text-primary truncate">{r.subject}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{r.body}</p>
                </div>
              ))}
            </div>

            <form
              action={async (fd: FormData) => {
                "use server";
                await createSupportRequest({
                  kind: "question",
                  subject: String(fd.get("subject") ?? ""),
                  body: String(fd.get("body") ?? ""),
                });
              }}
              className="pt-4 border-t border-outline-variant/20 flex flex-col gap-2"
            >
              <input
                type="text"
                name="subject"
                required
                minLength={3}
                maxLength={200}
                placeholder={tSupportForm("labels.subjectPlaceholder")}
                className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="body"
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder={tSupportForm("labels.bodyPlaceholder")}
                  className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <PendingButton
                  className="bg-primary hover:bg-primary-container text-on-primary p-3 rounded-xl transition-colors shrink-0"
                >
                  <Send size={18} aria-hidden="true" />
                </PendingButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
