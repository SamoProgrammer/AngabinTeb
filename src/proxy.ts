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
    for (const l of locales) {
      const prefix = `/${l}/nutrition/`;
      if (pathname.startsWith(prefix)) {
        const sub = pathname.slice(prefix.length);
        if (["diary", "body", "diet", "foods"].some((s) => sub === s || sub.startsWith(`${s}/`))) {
          const url = req.nextUrl.clone();
          url.pathname = `/${l}/${sub}`;
          return NextResponse.rewrite(url);
        }
      }
    }
    return NextResponse.next();
  }

  const accept = req.headers.get("accept-language") ?? "";
  const preferred = locales.find((l) => accept.toLowerCase().includes(l));
  const target = preferred ?? defaultLocale;
  return NextResponse.redirect(new URL(`/${target}${pathname}${req.nextUrl.search}`, req.url));
}