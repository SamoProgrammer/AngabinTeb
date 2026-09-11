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
  const locale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (locale) {
    const rest = pathname.slice(locale.length + 1) || "/";
    const guarded = ["/profile", "/notifications", "/admin", "/support", "/diet/payment", "/diet/check"];
    if (guarded.some((g) => rest === g || rest.startsWith(`${g}/`))) {
      const echo = new Headers(req.headers);
      echo.set("x-auth-return", `${pathname}${req.nextUrl.search}`);
      return NextResponse.next({ request: { headers: echo } });
    }
    return NextResponse.next();
  }

  // Site root only: every in-app link is locale-prefixed, so all other
  // locale-less paths fall through (legacy + bare-link 307s nuked).
  if (pathname === "/") {
    const accept = req.headers.get("accept-language") ?? "";
    const preferred = locales.find((l) => accept.toLowerCase().includes(l));
    const target = preferred ?? defaultLocale;
    return NextResponse.redirect(new URL(`/${target}${req.nextUrl.search}`, req.url), 307);
  }
  return NextResponse.next();
}
