import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/locales";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/api-test/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  const accept = req.headers.get("accept-language") ?? "";
  const preferred = locales.find((l) => accept.toLowerCase().includes(l));
  const target = preferred ?? defaultLocale;
  // Bare-link 307 (temporary): locale prefix only, path + searchParams preserved.
  return NextResponse.redirect(new URL(`/${target}${pathname}${req.nextUrl.search}`, req.url), 307);
}