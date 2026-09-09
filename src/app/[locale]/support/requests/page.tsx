import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { listRequests } from "@/contexts/support/queries";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDateTime } from "@/lib/format";
import { ArrowLeft, ArrowRight, Clock, Inbox, Plus, Tag } from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "destructive",
};

const KNOWN_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const KNOWN_KINDS = ["question", "complaint", "appointment_issue"] as const;

export default async function MyRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser();
  const rows = await listRequests({ userId: user.id });
  const t = await getTranslations("support.requests");
  const isRtl = locale !== "en";
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const CtaArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href={`/${locale}/support`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <ArrowIcon size={16} aria-hidden="true" />
            <span>{t("backLink")}</span>
          </Link>

          <Link
            href={`/${locale}/support/new`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-primary text-on-primary px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-primary-container transition-all"
          >
            <Plus size={16} aria-hidden="true" />
            <span>{t("newRequest")}</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-start mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>

        {/* List of Requests */}
        <ul className="space-y-4">
          {rows.map((r) => {
            const statusLabel = KNOWN_STATUSES.includes(r.status as (typeof KNOWN_STATUSES)[number])
              ? t(`statuses.${r.status as (typeof KNOWN_STATUSES)[number]}`)
              : r.status;

            const kindLabel = KNOWN_KINDS.includes(r.kind as (typeof KNOWN_KINDS)[number])
              ? t(`kinds.${r.kind as (typeof KNOWN_KINDS)[number]}`)
              : r.kind;

            const formattedDate = formatJalaliDateTime(r.createdAt, locale);

            return (
              <li
                key={r.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-xs text-start transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="font-bold text-sm sm:text-base text-on-surface">{r.subject}</h2>
                  <Badge variant={STATUS_VARIANTS[r.status] ?? "default"}>{statusLabel}</Badge>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-md mb-3">
                  <Tag size={14} aria-hidden="true" />
                  <span>{kindLabel}</span>
                </div>

                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-3 whitespace-pre-wrap">
                  {r.body}
                </p>

                <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between text-[11px] text-outline">
                  <span className="flex items-center gap-1">
                    <Clock size={14} aria-hidden="true" />
                    <span>{formattedDate}</span>
                  </span>
                  <span>#{r.id.slice(0, 8)}</span>
                </div>
              </li>
            );
          })}

          {rows.length === 0 && (
            <li className="bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/40 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
                <Inbox size={24} aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">
                {t("empty")}
              </p>
              <Link
                href={`/${locale}/support/new`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <span>{t("newRequest")}</span>
                <CtaArrowIcon size={14} aria-hidden="true" />
              </Link>
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}