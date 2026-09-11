import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import {
  Bell,
  CalendarClock,
  CircleUserRound,
  ClipboardList,
  Hourglass,
  Plus,
  Salad,
  Scale,
  Ticket,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import { clinicalMessages, users, wallets } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { myAppointments } from "@/contexts/booking/queries";
import {
  getPhysiology,
  listPeriods,
  myDietClaims,
  periodEntries,
  weightHistory,
} from "@/contexts/nutrition/queries";
import { unreadCount } from "@/contexts/support/queries";
import { PendingLink } from "@/components/clinical/pending-link";
import {
  formatJalaliDate,
  formatJalaliDateTime,
  formatPrice,
  toPersianDigits,
} from "@/lib/format";

const STATUS_KEYS: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  generating: "statusGenerating",
  needs_review: "statusNeedsReview",
  ready: "statusReady",
  failed: "statusFailed",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  generating: "bg-orange-100 text-orange-900",
  needs_review: "bg-violet-100 text-violet-900",
  ready: "bg-emerald-100 text-emerald-900",
  failed: "bg-red-100 text-red-900",
};

const cardClass =
  "bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/30 flex flex-col gap-4";

export default async function ProfileHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const t = await getTranslations("account.hub");
  const tov = await getTranslations("account.overview");
  const tn = await getTranslations("nutrition");
  const ts = await getTranslations("states");
  const busyLabel = ts("loading");
  const dir = locale === "en" ? "ltr" : "rtl";
  const digits = (v: string | number) =>
    locale === "en" ? String(v) : toPersianDigits(v);

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  const [claims, periods, profile, history, appointments, unreadNotifications, inbox, walletRows] =
    await Promise.all([
      myDietClaims(user.id, locale),
      listPeriods(user.id),
      getPhysiology(user.id),
      weightHistory(user.id),
      myAppointments(user.id),
      unreadCount(user.id),
      db
        .select()
        .from(clinicalMessages)
        .where(eq(clinicalMessages.recipientUserId, user.id))
        .orderBy(desc(clinicalMessages.sentAt))
        .limit(50),
      db.select().from(wallets).where(eq(wallets.userId, user.id)),
    ]);

  const latestPeriod = periods[0] ?? null;
  const entryCount = latestPeriod
    ? (await periodEntries(user.id, latestPeriod.id)).length
    : 0;

  const latestWeigh = history.length > 0 ? history[history.length - 1] : null;
  const bodyWeight = latestWeigh
    ? digits(Number(latestWeigh.weightKg))
    : profile?.weightKg
      ? digits(Number(profile.weightKg))
      : null;

  const pending = claims.find((c) => c.status === "pending") ?? null;
  const paid = claims.find((c) => c.status === "paid") ?? null;
  const primaryHref = pending
    ? `/${locale}/diet/payment?claim=${pending.claimId}`
    : `/${locale}/diet`;

  // Row 1 queues (aria-labels + empty states via account.overview keys).
  const now = Date.now();
  const upcoming = appointments
    .filter(
      (a) =>
        a.status !== "cancelled" &&
        a.startsAt instanceof Date &&
        a.startsAt.getTime() >= now,
    )
    .sort((a, b) => (a.startsAt as Date).getTime() - (b.startsAt as Date).getTime());
  const nextAppt = upcoming[0] ?? null;
  const dietActions = claims.filter(
    (c) => c.status === "pending" || c.status === "paid" || c.status === "generating",
  );
  const dietQueueHref = pending
    ? `/${locale}/diet/payment?claim=${pending.claimId}`
    : paid
      ? `/${locale}/diet/check?claim=${paid.claimId}`
      : "./diets";
  const unreadInbox = inbox.filter((m) => !m.isRead).length;
  const unreadTotal = unreadInbox + unreadNotifications;
  const balance = Number(walletRows[0]?.balance ?? 0);

  return (
    <div className="flex flex-col gap-6 text-start" dir={dir}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant mt-1">
          {t("subtitle")}
        </p>
      </div>

      <section
        aria-label={tov("title")}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <PendingLink
          href="./reservations"
          busyLabel={busyLabel}
          className={`${cardClass} group hover:border-primary/40 hover:shadow-tier-1 transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">
              {tov("queueNext")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <CalendarClock size={22} aria-hidden="true" />
            </div>
          </div>
          {nextAppt ? (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm text-on-surface truncate">
                {nextAppt.serviceName}
              </p>
              <p className="text-xs text-on-surface-variant">
                {formatJalaliDateTime(nextAppt.startsAt as Date, locale)}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {tov("queueNextEmpty")}
            </p>
          )}
        </PendingLink>

        <PendingLink
          href={dietQueueHref}
          busyLabel={busyLabel}
          className={`${cardClass} group hover:border-primary/40 hover:shadow-tier-1 transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">
              {tov("queueDiets")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <Salad size={22} aria-hidden="true" />
            </div>
          </div>
          {dietActions.length === 0 ? (
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {tov("queuesEmpty")}
            </p>
          ) : (
            <p className="font-extrabold text-3xl text-on-surface">
              {digits(dietActions.length)}
            </p>
          )}
        </PendingLink>

        <PendingLink
          href="./messages"
          busyLabel={busyLabel}
          className={`${cardClass} group hover:border-primary/40 hover:shadow-tier-1 transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">
              {tov("queueUnread")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <Bell size={22} aria-hidden="true" />
            </div>
          </div>
          {unreadTotal === 0 ? (
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {tov("queuesEmpty")}
            </p>
          ) : (
            <p className="font-extrabold text-3xl text-on-surface">
              {digits(unreadTotal)}
            </p>
          )}
        </PendingLink>

        <PendingLink
          href="./balance"
          busyLabel={busyLabel}
          className={`${cardClass} group hover:border-primary/40 hover:shadow-tier-1 transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">
              {tov("queueWallet")}
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <Wallet size={22} aria-hidden="true" />
            </div>
          </div>
          <p className="font-extrabold text-lg text-on-surface">
            {formatPrice(balance, locale)}
          </p>
        </PendingLink>
      </section>

      <PendingLink
        href={primaryHref}
        busyLabel={busyLabel}
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all self-start"
      >
        <span>{pending ? t("primaryResume") : t("primaryNew")}</span>
      </PendingLink>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section aria-label={t("identityTitle")} className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <CircleUserRound size={22} aria-hidden="true" />
            </div>
            <h2 className="font-bold text-sm sm:text-base text-on-surface">
              {t("identityTitle")}
            </h2>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-bold text-sm text-on-surface">
              {row?.name || t("identityEmpty")}
            </p>
            {row?.phoneNumber && (
              <p className="text-xs text-on-surface-variant font-mono" dir="ltr">
                {row.phoneNumber}
              </p>
            )}
          </div>
          <Link
            href="./clinical"
            className="text-primary text-xs sm:text-sm font-bold underline self-start"
          >
            {t("identityEdit")}
          </Link>
        </section>

        <section aria-label={t("dietsTitle")} className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Salad size={22} aria-hidden="true" />
            </div>
            <h2 className="font-bold text-sm sm:text-base text-on-surface">
              {t("dietsTitle")}
            </h2>
          </div>
          {claims.length === 0 ? (
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t("dietsEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {claims.slice(0, 3).map((c) => (
                <li
                  key={c.claimId}
                  className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <span className="font-bold text-on-surface truncate">
                    {c.programName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] shrink-0 ${STATUS_STYLES[c.status] ?? "bg-surface-container-high text-on-surface-variant"}`}
                  >
                    <Hourglass size={12} aria-hidden="true" />
                    <span>
                      {STATUS_KEYS[c.status]
                        ? tn(`dietWizard.${STATUS_KEYS[c.status]}`)
                        : c.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="./diets"
            className="text-primary text-xs sm:text-sm font-bold underline self-start"
          >
            {t("dietsAll")}
          </Link>
        </section>

        <section aria-label={t("calorieTitle")} className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClipboardList size={22} aria-hidden="true" />
            </div>
            <h2 className="font-bold text-sm sm:text-base text-on-surface">
              {t("calorieTitle")}
            </h2>
          </div>
          {latestPeriod ? (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm text-on-surface">
                {latestPeriod.title}
              </p>
              <p className="text-xs text-on-surface-variant">
                {formatJalaliDate(`${latestPeriod.startsOn}T12:00:00Z`, locale)}
                {" • "}
                {t("calorieEntries", { count: digits(entryCount) })}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t("calorieEmpty")}
            </p>
          )}
          <Link
            href="./calorie"
            className="text-primary text-xs sm:text-sm font-bold underline self-start"
          >
            {t("calorieCta")}
          </Link>
        </section>

        <section aria-label={t("bodyTitle")} className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Scale size={22} aria-hidden="true" />
            </div>
            <h2 className="font-bold text-sm sm:text-base text-on-surface">
              {t("bodyTitle")}
            </h2>
          </div>
          {bodyWeight ? (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm text-on-surface">{bodyWeight}</p>
              {latestWeigh && (
                <p className="text-xs text-on-surface-variant">
                  {formatJalaliDate(`${latestWeigh.loggedAt}T12:00:00Z`, locale)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t("bodyEmpty")}
            </p>
          )}
          <Link
            href="./body"
            className="text-primary text-xs sm:text-sm font-bold underline self-start"
          >
            {t("bodyCta")}
          </Link>
        </section>
      </div>

      <nav
        aria-label={tov("quickActions")}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <PendingLink
          href={`/${locale}/booking/doctors`}
          busyLabel={busyLabel}
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:shadow-tier-1 transition-all"
        >
          <Plus size={16} aria-hidden="true" />
          <span>{tov("qaBook")}</span>
        </PendingLink>
        <PendingLink
          href={primaryHref}
          busyLabel={busyLabel}
          className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:border-primary/40 transition-all"
        >
          <Salad size={16} aria-hidden="true" />
          <span>{tov("qaDiet")}</span>
        </PendingLink>
        <PendingLink
          href={`/${locale}/support/new`}
          busyLabel={busyLabel}
          className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:border-primary/40 transition-all"
        >
          <Ticket size={16} aria-hidden="true" />
          <span>{tov("qaTicket")}</span>
        </PendingLink>
        <PendingLink
          href="./personal-info"
          busyLabel={busyLabel}
          className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:border-primary/40 transition-all"
        >
          <CircleUserRound size={16} aria-hidden="true" />
          <span>{tov("qaProfile")}</span>
        </PendingLink>
      </nav>
    </div>
  );
}
