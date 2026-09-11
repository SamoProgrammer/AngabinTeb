import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { availabilitySlots, providers } from "@/db/schema";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import { PendingSubmit } from "@/components/clinical/pending-submit";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";

export default async function AdminSchedulingPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ date?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tScheduling = await getTranslations("admin.scheduling");
  const tCommon = await getTranslations("admin.common");
  const tNav = await getTranslations("admin.nav");

  const sp = (await searchParams) ?? {};
  const rawDate = typeof sp.date === "string" ? sp.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(`${date}T23:59:59Z`);

  const slotRows = await db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      capacity: availabilitySlots.capacity,
      bookedCount: availabilitySlots.bookedCount,
      providerId: availabilitySlots.providerId,
      providerName: providers.name,
    })
    .from(availabilitySlots)
    .innerJoin(providers, eq(availabilitySlots.providerId, providers.id))
    .where(
      and(
        sql`${availabilitySlots.startsAt} >= ${dayStart} AND ${availabilitySlots.startsAt} <= ${dayEnd}`,
      ),
    )
    .orderBy(availabilitySlots.startsAt)
    .limit(200);

  // ponytail: in-page group-by-provider; move to a DB-level aggregation past ~200 slots/day.
  const groups = new Map<string, { providerName: string; slots: typeof slotRows }>();
  for (const s of slotRows) {
    const g = groups.get(s.providerId) ?? { providerName: s.providerName, slots: [] };
    g.slots.push(s);
    groups.set(s.providerId, g);
  }

  const fmt = (n: number) => (locale === "en" ? `${n}` : toPersianDigits(n));

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tScheduling("title") }]}
        title={tScheduling("title")}
        subtitle={tScheduling("subtitle")}
      />
      <form method="get" className="mb-6 flex items-end gap-2">
        <JalaliDatePicker locale={locale} name="date" defaultValue={date} />
        <PendingSubmit className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold hover:bg-primary-container transition-colors">
          {tCommon("filter")}
        </PendingSubmit>
      </form>
      {groups.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          {date} · {tCommon("emptyValue")}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups].map(([providerId, g]) => (
            <section key={providerId} aria-label={g.providerName}>
              <Link
                href={`${prefix}/admin/providers/${providerId}?tab=slots&date=${date}`}
                className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface shadow-tier-1 transition-colors hover:bg-surface-container"
              >
                <span>{g.providerName}</span>
                <span className="text-xs font-bold text-on-surface-variant">
                  {fmt(g.slots.reduce((sum, s) => sum + s.bookedCount, 0))}/
                  {fmt(g.slots.reduce((sum, s) => sum + s.capacity, 0))}
                </span>
              </Link>
              <ul className="flex flex-col gap-2">
                {g.slots.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm shadow-tier-1"
                  >
                    <span className="font-medium text-on-surface">
                      {formatJalaliDateTime(s.startsAt, locale)}
                    </span>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface-variant">
                      {fmt(s.bookedCount)}/{fmt(s.capacity)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
