"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const locales = ["fa", "en", "ar"] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: string) {
    const rest = pathname.replace(`/${locale}`, "") || "/";
    startTransition(() => router.replace(`/${next}${rest}`));
  }

  return (
    <select
      value={locale}
      disabled={isPending}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Change language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  );
}