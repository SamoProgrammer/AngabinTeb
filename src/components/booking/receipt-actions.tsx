"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Copy, Printer } from "lucide-react";

interface ReceiptActionsProps {
  trackingCode: string;
  appointmentsHref: string;
  homeHref: string;
  locale?: string;
}

export function ReceiptActions({
  trackingCode,
  appointmentsHref,
  homeHref,
}: ReceiptActionsProps) {
  const t = useTranslations("booking");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const printLabel = t("receiptPrint");

  const copyLabel = copied ? t("receiptCopied") : t("receiptCopy");

  const myRecordsLabel = t("receiptRecords");

  const homeLabel = t("receiptHome");

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-all shadow-sm cursor-pointer"
      >
        <Printer size={20} aria-hidden="true" />
        <span>{printLabel}</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
      >
        <Copy size={20} aria-hidden="true" />
        <span>{copyLabel}</span>
      </button>

      <Link
        href={appointmentsHref}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition-colors"
      >
        <span>{myRecordsLabel}</span>
      </Link>

      <Link
        href={homeHref}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 font-semibold transition-colors"
      >
        <span>{homeLabel}</span>
      </Link>
    </div>
  );
}
