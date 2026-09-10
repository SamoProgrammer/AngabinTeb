import { getTranslations } from "next-intl/server";
import { Check, Pencil, RotateCcw, Save, X } from "lucide-react";
import { requireAdmin } from "@/contexts/identity/actions";
import {
  approveClaim,
  cancelClaim,
  requestClaimChanges,
  resetClaimToPaid,
  retryClaimGeneration,
  saveDocumentBody,
} from "@/contexts/nutrition/actions";
import { allClaims } from "@/contexts/nutrition/queries";
import ClaimPoller from "./claim-poller";
import DocModal from "./doc-modal";
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

export default async function AdminDietClaimsPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const dir = locale === "en" ? "ltr" : "rtl";

  await requireAdmin();

  const t = await getTranslations("admin.dietPrograms.claims");
  const tCommon = await getTranslations("admin.common");

  const rows = await allClaims();

  return (
    <div className="text-start" dir={dir}>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{t("empty")}</p>
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
            {rows.map((r) => {
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
                    <details>
                      <summary className="cursor-pointer py-2 text-xs font-bold text-primary">
                        {t("snapshot")}
                      </summary>
                      {snapshot ? (
                        <pre
                          dir="ltr"
                          className="mt-2 max-h-64 overflow-auto rounded-xl bg-surface-container-low p-3 text-start text-[11px] leading-relaxed"
                        >
                          {JSON.stringify(snapshot, null, 2)}
                        </pre>
                      ) : (
                        <p className="mt-2 text-xs text-on-surface-variant">{t("noSnapshot")}</p>
                      )}
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await requestClaimChanges(
                            String(fd.get("claimId")),
                            String(fd.get("note") ?? ""),
                          );
                        }}
                        className="mt-2 flex flex-col gap-2"
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
                        className="mt-2 flex flex-col gap-2"
                      >
                        <input type="hidden" name="claimId" value={r.claimId} />
                        <span className="text-xs font-bold text-on-surface">{t("docTitle")}</span>
                        {r.documentBody ? (
                          <DocModal
                            openLabel={t("docView")}
                            title={t("docTitle")}
                            body={r.documentBody}
                          />
                        ) : (
                          <p className="text-xs text-on-surface-variant">{t("noDocument")}</p>
                        )}
                        <textarea
                          name="body"
                          rows={3}
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
                    </details>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
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
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await retryClaimGeneration(String(fd.get("claimId")));
                        }}
                      >
                        <input type="hidden" name="claimId" value={r.claimId} />
                        <PendingButton
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high"
                        >
                          <RotateCcw size={14} aria-hidden="true" />
                          <span>{t("retry")}</span>
                        </PendingButton>
                      </form>
                      <form
                        action={async (fd: FormData) => {
                          "use server";
                          await resetClaimToPaid(String(fd.get("claimId")));
                        }}
                      >
                        <input type="hidden" name="claimId" value={r.claimId} />
                        <PendingButton
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                        >
                          <span>{t("resetClaim")}</span>
                        </PendingButton>
                      </form>
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
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
