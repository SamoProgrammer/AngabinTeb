import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import {
  CircleUserRound,
  ClipboardList,
  Hourglass,
  Salad,
  Scale,
} from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import {
  getPhysiology,
  listPeriods,
  myDietClaims,
  periodEntries,
  weightHistory,
} from "@/contexts/nutrition/queries";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

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
  const tn = await getTranslations("nutrition");
  const dir = locale === "en" ? "ltr" : "rtl";
  const digits = (v: string | number) =>
    locale === "en" ? String(v) : toPersianDigits(v);

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  const [claims, periods, profile, history] = await Promise.all([
    myDietClaims(user.id, locale),
    listPeriods(user.id),
    getPhysiology(user.id),
    weightHistory(user.id),
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
  const primaryHref = pending
    ? `/${locale}/diet/payment?claim=${pending.claimId}`
    : `/${locale}/diet`;

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

      <Link
        href={primaryHref}
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all self-start"
      >
        <span>{pending ? t("primaryResume") : t("primaryNew")}</span>
      </Link>

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
    </div>
  );
}
