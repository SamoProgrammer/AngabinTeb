import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { locales } from "@/i18n/locales";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  return (
    <html lang={locale} dir={locale === "en" ? "ltr" : "rtl"}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}