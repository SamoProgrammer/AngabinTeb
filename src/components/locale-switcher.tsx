"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/i18n/locales";

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const t = useTranslations("locale");
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: string) {
    if (next === currentLocale) return;

    // Split pathname into clean segments and sanitize any existing locale prefix
    const rawSegments = (pathname || "/").split("/").filter(Boolean);
    const cleanSegments = rawSegments.filter((seg, idx) => idx === 0 || !locales.includes(seg as Locale));

    if (cleanSegments.length > 0 && locales.includes(cleanSegments[0] as Locale)) {
      cleanSegments[0] = next;
    } else {
      cleanSegments.unshift(next);
    }

    const nextPath = "/" + cleanSegments.join("/");
    const search = typeof window !== "undefined" ? window.location.search : "";

    startTransition(() => {
      // Force clean browser reload to ensure <html> dir (RTL/LTR) and fonts re-initialize cleanly
      window.location.assign(`${nextPath}${search}`);
    });
  }

  return (
    <select
      value={currentLocale}
      disabled={isPending}
      onChange={(e) => onSelect(e.target.value)}
      aria-label={t("switch")}
      className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
    >
      <option value="fa">{t("fa")} (FA)</option>
      <option value="en">{t("en")} (EN)</option>
      <option value="ar">{t("ar")} (AR)</option>
    </select>
  );
}