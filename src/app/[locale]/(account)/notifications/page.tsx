import { requireUser } from "@/contexts/identity/actions";
import { listNotifications } from "@/contexts/support/queries";
import { markNotificationsRead } from "@/contexts/support/actions";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function NotificationsPage() {
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
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-start">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-full self-start">
              <ClinicalIcon name="notifications" size={16} />
              <span>مرکز پیام‌های پرونده</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              اعلان‌ها و یادآوری‌های سلامت
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              اطلاع‌رسانی‌های نوبت ویزیت، پیام‌های پزشک و یادآوری‌های پایش سلامت
            </p>
          </div>

          {unread.length > 0 && (
            <form action={markNotificationsRead} className="self-start sm:self-auto">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <ClinicalIcon name="done_all" size={16} />
                <span>علامت‌گذاری همه به عنوان خوانده شده</span>
              </button>
            </form>
          )}
        </div>

        {/* Notifications Feed (Screen #10) */}
        <div className="flex flex-col gap-3">
          {rows.map((n) => {
            const dateStr = new Intl.DateTimeFormat("fa-IR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(n.createdAt));

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
                    <ClinicalIcon name={getNotificationIcon(n.kind)} size={22} />
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
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="پیام جدید" />
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
                <ClinicalIcon name="notifications_none" size={32} />
              </div>
              <p className="text-base font-bold text-on-surface">پیام یا اعلانی وجود ندارد</p>
              <p className="text-xs text-on-surface-variant max-w-sm">
                تمامی پیام‌ها، تایید نوبت‌ها و یادآوری‌های پرونده در این قسمت نمایش داده می‌شوند.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}