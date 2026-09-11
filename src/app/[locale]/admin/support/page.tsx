import { getTranslations } from "next-intl/server";
import { listRequests } from "@/contexts/support/queries";
import { updateRequestStatus } from "@/contexts/support/actions";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PendingButton } from "@/components/clinical/pending-button";
import { PendingLink } from "@/components/clinical/pending-link";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;
const SUPPORT_TABS = ["all", ...STATUS_OPTIONS] as const;

export default async function AdminSupportPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const dir = locale === "en" ? "ltr" : "rtl";
  const prefix = `/${locale}`;

  const tSupport = await getTranslations("admin.support");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");
  const ts = await getTranslations("states");
  const busyLabel = ts("loading");

  const { q, tab, page } = parseListParams((await searchParams) ?? {}, {
    tabs: SUPPORT_TABS,
    defaultTab: "open",
  });

  const rows = await listRequests();

  const counts: Record<string, number> = { all: rows.length };
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

  // ponytail: in-page status + text filter; move to a DB-level filter past ~200 requests.
  const filtered = rows.filter(
    (r) =>
      (tab === "all" || r.status === tab) &&
      (q === "" ||
        r.subject.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q)),
  );
  const { items, totalPages } = paginate(filtered, page);

  const fmtCount = (n: number) => (locale === "en" ? `${n}` : toPersianDigits(n));
  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const allLabel = locale === "en" ? "All" : locale === "ar" ? "الكل" : "همه";
  const tabLabel = (s: string) => (s === "all" ? allLabel : tSupport(`statuses.${s}` as any));
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;

  return (
    <div className="text-start" dir={dir}>
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tSupport("title") }]}
        title={tSupport("title")}
      />
      {rows.length === 0 ? (
        <AdminEmpty title={tSupport("empty")} />
      ) : (
        <>
          <div className="mb-4">
            <AdminToolbar
              placeholder={tSearch("search")}
              searchLabel={tCommon("filter")}
              currentQ={q}
              hidden={{ status: tab }}
            />
          </div>
          <nav aria-label={tCommon("status")} className="mb-4 flex flex-wrap items-center gap-2">
            {SUPPORT_TABS.map((s) => {
              const active = tab === s;
              return (
                <PendingLink
                  key={s}
                  href={`?status=${s}${qParam}`}
                  busyLabel={busyLabel}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                      : "inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  }
                >
                  <span>{tabLabel(s)}</span>
                  <span
                    className={
                      active
                        ? "rounded-full bg-on-primary/20 px-1.5 py-0.5 text-[11px]"
                        : "rounded-full bg-surface-container px-1.5 py-0.5 text-[11px]"
                    }
                  >
                    {fmtCount(s === "all" ? rows.length : (counts[s] ?? 0))}
                  </span>
                </PendingLink>
              );
            })}
          </nav>
          {items.length === 0 ? (
            <AdminEmpty title={tSupport("empty")} />
          ) : (
            <ul className="space-y-4">
              {items.map((r) => {
                const formattedDate = formatJalaliDateTime(r.createdAt, locale);

                return (
                  <li key={r.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-on-surface">{r.subject}</p>
                      <div className="flex gap-2">
                        <Badge>{r.kind}</Badge>
                        <Badge variant={r.priority === "high" ? "destructive" : "secondary"}>{r.priority}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">{r.body}</p>
                    <p className="mt-2 text-xs text-outline">
                      {formattedDate} · {tSupport("userPrefix")} {r.userId.slice(0, 8)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await updateRequestStatus(r.id, fd);
                        }}
                        className="flex items-center gap-2"
                      >
                        <select
                          name="status"
                          defaultValue={r.status}
                          className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-2.5 py-1.5 text-sm outline-none"
                        >
                          {STATUS_OPTIONS.map((statusKey) => (
                            <option key={statusKey} value={statusKey}>
                              {tSupport(`statuses.${statusKey}` as any)}
                            </option>
                          ))}
                        </select>
                        <PendingButton
                          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-container cursor-pointer"
                        >
                          {tSupport("updateBtn")}
                        </PendingButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              hrefFor={(p) => `?status=${tab}${qParam}&page=${p}`}
              prevLabel={prevLabel}
              nextLabel={nextLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}
