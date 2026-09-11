import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { listNotifications } from "@/contexts/support/queries";
import { markNotificationsRead } from "@/contexts/support/actions";
import { PendingButton } from "@/components/clinical/pending-button";
import { UserPageHeader } from "@/components/account/user-page-header";
import { resolveIcon } from "@/components/clinical/icons";
import { formatJalaliDateTime } from "@/lib/format";
import { BellOff, CheckCheck } from "lucide-react";

export default async function NotificationsPage({
  params,
}: {
  params?: Promise<{ locale?: string }> | { locale?: string };
} = {}) {
  let locale = "fa";
  if (params && typeof (params as Promise<unknown>).then === "function") {
    try {
      const resolved = await (params as Promise<{ locale?: string }>);
      locale = resolved?.locale ?? "fa";
    } catch {
      locale = "fa";
    }
  } else if (params && "locale" in params) {
    locale = (params as { locale?: string }).locale ?? "fa";
  }

  const t = await getTranslations("notifications");
  const isRtl = locale !== "en";

  const user = await requireUser();
  const rows = await listNotifications(user.id);
  const unread = rows.filter((n) => !n.read);

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case "appointment":
      case "booking":
        return "calendar_today";
      case "reminder":
        return "alarm";
      case "support":
        return "support_agent";
      default:
        return "notifications";
    }
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <UserPageHeader
          locale={locale}
          title={t("title")}
          subtitle={t("subtitle")}
          action={
            unread.length > 0 ? (
              <form action={markNotificationsRead} className="self-start sm:self-auto">
                <PendingButton
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCheck size={16} aria-hidden="true" />
                  <span>{t("markAllRead")}</span>
                </PendingButton>
              </form>
            ) : undefined
          }
        />

        {/* Notifications Feed (Screen #10) */}
        <div className="flex flex-col gap-3">
          {rows.map((n) => {
            const dateStr = formatJalaliDateTime(n.createdAt, locale);

            return (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 text-start ${
                  !n.read
                    ? "bg-surface-container-lowest border-primary/40 shadow-xs ring-1 ring-primary/10"
                    : "bg-surface-container-low/50 border-outline-variant/20 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      !n.read ? "bg-primary/10 text-primary" : "bg-surface-container text-outline"
                    }`}
                  >
                    {(() => {
                      const NotificationIcon = resolveIcon(getNotificationIcon(n.kind));
                      return <NotificationIcon size={22} aria-hidden="true" />;
                    })()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`text-sm sm:text-base ${
                          !n.read ? "font-bold text-on-surface" : "font-medium text-on-surface-variant"
                        }`}
                      >
                        {n.title}
                      </h2>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" title={t("unreadBadge")} />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {n.body}
                    </p>
                    <span className="text-[11px] text-outline mt-1">{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-container text-outline flex items-center justify-center">
                <BellOff size={32} aria-hidden="true" />
              </div>
              <p className="text-base font-bold text-on-surface">{t("emptyTitle")}</p>
              <p className="text-xs text-on-surface-variant max-w-sm">
                {t("emptyHint")}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
