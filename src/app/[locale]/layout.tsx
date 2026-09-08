import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { locales } from "@/i18n/locales";
import { vazirmatn, plusJakartaSans } from "@/app/fonts";
import { ClinicalHeader } from "@/components/layout/clinical-header";
import { ClinicalFooter } from "@/components/layout/clinical-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "en" ? "ltr" : "rtl"}
      className={`${vazirmatn.variable} ${plusJakartaSans.variable}`}
    >
      <body
        className={`${
          locale === "en" ? plusJakartaSans.className : vazirmatn.className
        } antialiased bg-surface text-on-surface flex flex-col min-h-screen`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClinicalHeader locale={locale} />
          <main className="flex-1 w-full">{children}</main>
          <ClinicalFooter locale={locale} />
          <MobileNav locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}