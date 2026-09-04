"use client";

import { useState } from "react";
import Link from "next/link";

interface ReceiptActionsProps {
  trackingCode: string;
  appointmentsHref: string;
  homeHref: string;
}

export function ReceiptActions({
  trackingCode,
  appointmentsHref,
  homeHref,
}: ReceiptActionsProps) {
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

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-all shadow-sm cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>چاپ یا دریافت فیش نوبت (PDF)</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>{copied ? "کپی شد!" : "کپی شناسه پیگیری"}</span>
      </button>

      <Link
        href={appointmentsHref}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition-colors"
      >
        <span>مشاهده در پرونده من</span>
      </Link>

      <Link
        href={homeHref}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 font-semibold transition-colors"
      >
        <span>صفحه اصلی</span>
      </Link>
    </div>
  );
}
