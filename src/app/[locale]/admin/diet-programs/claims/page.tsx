import { getTranslations } from "next-intl/server";
import { Check, Pencil, RotateCcw, Save, X } from "lucide-react";
import { requireAdmin } from "@/contexts/identity/actions";
import {
  approveClaim,
  cancelClaim,
  forceRegenerate,
  requestClaimChanges,
  saveDocumentBody,
} from "@/contexts/nutrition/actions";
import { allClaims } from "@/contexts/nutrition/queries";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PendingLink } from "@/components/clinical/pending-link";
import ClaimPoller from "./claim-poller";
import ClaimModal from "./claim-modal";
import { PendingButton } from "@/components/clinical/pending-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  needs_review: "bg-secondary/15 text-secondary",
  generating: "bg-primary/10 text-primary",
  paid: "bg-tertiary/10 text-tertiary",
  failed: "bg-destructive/10 text-destructive",
  ready: "bg-primary/15 text-primary",
  pending: "bg-surface-container-low text-on-surface-variant",
  completed: "bg-surface-container-low text-on-surface-variant",
};

const CLAIM_TABS = ["all", "pending", "paid", "generating", "needs_review", "ready", "failed"] as const;

export default async function AdminDietClaimsPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ status?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const dir = locale === "en" ? "ltr" : "rtl";
  const prefix = `/${locale}`;

  await requireAdmin();

  const t = await getTranslations("admin.dietPrograms.claims");
  const tCommon = await getTranslations("admin.common");
  const tDiet = await getTranslations("admin.dietPrograms");
  const tNav = await getTranslations("admin.nav");
  const ts = await getTranslations("states");
  const busyLabel = ts("loading");

  const { tab, page } = parseListParams((await searchParams) ?? {}, {
    tabs: CLAIM_TABS,
    defaultTab: "needs_review",
  });

  const rows = await allClaims();

  const counts: Record<string, number> = { all: rows.length };
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

  // ponytail: in-page status filter + slice; move to a DB-level filter past ~200 claims.
  const filtered = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  const { items, totalPages } = paginate(filtered, page);

  const fmtCount = (n: number) => (locale === "en" ? `${n}` : toPersianDigits(n));
  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const confirmCopy =
    locale === "en"
      ? {
          title: "Confirm cancellation",
          message: "This claim will be cancelled and removed from the queue. Continue?",
          cancelLabel: "Back",
        }
      : locale === "ar"
        ? {
            title: "تأكيد الإلغاء",
            message: "سيتم إلغاء هذا الطلب وإخراجه من القائمة. هل تريد المتابعة؟",
            cancelLabel: "رجوع",
          }
        : {
            title: "تأیید لغو درخواست",
            message: "این درخواست لغو می‌شود و از صف خارج می‌گردد. ادامه می‌دهید؟",
            cancelLabel: "انصراف",
          };

  return (
    <div className="text-start" dir={dir}>
      <AdminPageHeader
        crumbs={[
          { label: tNav("dashboard"), href: `${prefix}/admin` },
          { label: tDiet("title"), href: `${prefix}/admin/diet-programs` },
          { label: t("title") },
        ]}
        title={t("title")}
      />
      {rows.length === 0 ? (
        <AdminEmpty title={t("empty")} />
      ) : (
        <>
          <nav aria-label={tCommon("status")} className="mb-4 flex flex-wrap items-center gap-2">
            {CLAIM_TABS.map((s) => {
              const active = tab === s;
              return (
                <PendingLink
                  key={s}
                  href={`?status=${s}`}
                  busyLabel={busyLabel}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                      : "inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  }
                >
                  <span>{s}</span>
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
            <AdminEmpty title={t("empty")} />
          ) : (
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("claimant")}</TableHead>
              <TableHead>{t("program")}</TableHead>
              <TableHead>{t("org")}</TableHead>
              <TableHead>{tCommon("price")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{t("age")}</TableHead>
              <TableHead>{t("snapshot")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => {
              const formattedPrice =
                r.pricePaid == null
                  ? tCommon("emptyValue")
                  : locale === "en"
                    ? Number(r.pricePaid).toLocaleString()
                    : toPersianDigits(Number(r.pricePaid).toLocaleString());
              const ageDays = Math.max(
                0,
                Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86_400_000),
              );
              const ageText =
                locale === "en"
                  ? `${ageDays} ${t("ageUnit")}`
                  : `${toPersianDigits(ageDays)} ${t("ageUnit")}`;
              const snapshot = r.snapshotId
                ? {
                    personInfo: r.personInfo,
                    medicalHistory: r.medicalHistory,
                    drugHistory: r.drugHistory,
                    addictionHistory: r.addictionHistory,
                    nutritionInfo: r.nutritionInfo,
                    cardiovascularQuestions: r.cardiovascularQuestions,
                    anthropometric: r.anthropometric,
                    medicalDocuments: r.medicalDocuments,
                  }
                : null;
              return (
                <TableRow key={r.claimId}>
                  <TableCell className="font-medium">
                    <ClaimPoller claimId={r.claimId} status={r.status} />
                    <span className="block">{r.userName}</span>
                    <span className="block text-[11px] text-on-surface-variant" dir="ltr">
                      {r.userId}
                    </span>
                  </TableCell>
                  <TableCell>{r.programName}</TableCell>
                  <TableCell>{r.organizationContext ?? tCommon("emptyValue")}</TableCell>
                  <TableCell>{formattedPrice}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[r.status] ?? STATUS_STYLES.pending}`}
                    >
                      {r.status}
                    </span>
                    {r.lastError && (r.status === "failed" || r.status === "generating") && (
                      <details className="mt-1">
                        <summary className="cursor-pointer py-1 text-[11px] font-bold text-destructive">
                          {t("errorLabel")}
                        </summary>
                        <pre
                          dir="ltr"
                          className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-destructive/10 p-3 text-start text-[11px] leading-relaxed text-destructive"
                        >
                          {r.lastError}
                        </pre>
                      </details>
                    )}
                  </TableCell>
                  <TableCell>{ageText}</TableCell>
                  <TableCell>
                    <ClaimModal
                      openLabel={t("viewDetails")}
                      title={`${r.programName} — ${r.userName}`}
                      sections={[
                        {
                          title: t("errorLabel"),
                          body: r.lastError,
                          emptyText: t("noError"),
                          dir: "ltr",
                          tone: "danger",
                        },
                        {
                          title: t("docTitle"),
                          body: r.documentBody,
                          emptyText: t("noDocument"),
                        },
                        {
                          title: t("snapshot"),
                          body: snapshot ? JSON.stringify(snapshot, null, 2) : null,
                          emptyText: t("noSnapshot"),
                          dir: "ltr",
                        },
                      ]}
                    >
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await requestClaimChanges(
                            String(fd.get("claimId")),
                            String(fd.get("note") ?? ""),
                          );
                        }}
                        className="flex flex-col gap-2"
                      >
                        <input type="hidden" name="claimId" value={r.claimId} />
                        <input
                          type="text"
                          name="note"
                          required
                          minLength={3}
                          maxLength={2000}
                          placeholder={t("notePlaceholder")}
                          className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <PendingButton
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary/15 px-3 py-2 text-xs font-bold text-secondary transition-colors hover:bg-secondary/25"
                        >
                          <Pencil size={14} aria-hidden="true" />
                          <span>{t("requestChanges")}</span>
                        </PendingButton>
                      </form>
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await saveDocumentBody(
                            String(fd.get("claimId")),
                            String(fd.get("body") ?? ""),
                          );
                        }}
                        className="flex flex-col gap-2"
                      >
                        <input type="hidden" name="claimId" value={r.claimId} />
                        <textarea
                          name="body"
                          rows={6}
                          dir="ltr"
                          defaultValue={r.documentBody ?? ""}
                          placeholder={t("bodyPlaceholder")}
                          className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5 text-start text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <PendingButton
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high"
                        >
                          <Save size={14} aria-hidden="true" />
                          <span>{t("saveBody")}</span>
                        </PendingButton>
                      </form>
                    </ClaimModal>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      {r.status === "needs_review" && (
                        <form
                          action={async (fd: FormData) => {
                            "use server";
                            await approveClaim(String(fd.get("claimId")));
                          }}
                        >
                          <input type="hidden" name="claimId" value={r.claimId} />
                          <PendingButton
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-colors hover:bg-primary-container"
                          >
                            <Check size={14} aria-hidden="true" />
                            <span>{t("approve")}</span>
                          </PendingButton>
                        </form>
                      )}
                      {(r.status === "paid" ||
                        r.status === "generating" ||
                        r.status === "needs_review" ||
                        r.status === "failed") && (
                        <form
                          action={async (fd: FormData) => {
                            "use server";
                            await forceRegenerate(String(fd.get("claimId")));
                          }}
                        >
                          <input type="hidden" name="claimId" value={r.claimId} />
                          <PendingButton
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                          >
                            <RotateCcw size={14} aria-hidden="true" />
                            <span>{t("forceRegen")}</span>
                          </PendingButton>
                        </form>
                      )}
                      {r.status !== "completed" && (
                        <ConfirmAction
                          openLabel={t("cancel")}
                          title={confirmCopy.title}
                          message={confirmCopy.message}
                          cancelLabel={confirmCopy.cancelLabel}
                          confirmSlot={
                            <form
                              action={async (fd: FormData) => {
                                "use server";
                                await cancelClaim(String(fd.get("claimId")));
                              }}
                            >
                              <input type="hidden" name="claimId" value={r.claimId} />
                              <PendingButton
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20"
                              >
                                <X size={14} aria-hidden="true" />
                                <span>{t("cancel")}</span>
                              </PendingButton>
                            </form>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
          )}
          <div className="mt-4">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              hrefFor={(p) => `?status=${tab}&page=${p}`}
              prevLabel={prevLabel}
              nextLabel={nextLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}
