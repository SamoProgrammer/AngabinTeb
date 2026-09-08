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
      if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
        const rest = pathname.slice(`/${l}`.length);
        // Temporary 307s for nuked nutrition paths (same style as bare-link 307).
        const redirects: Array<[string, string]> = [
          ["/nutrition/diary", `/${l}/nutrition/calorie`],
          ["/nutrition/nutrition", `/${l}/nutrition/calorie`],
          ["/food-analysis", `/${l}/nutrition/calorie`],
          ["/booking/offline-diet", `/${l}/nutrition/diet`],
          ["/foods/meal-type", `/${l}/foods`],
        ];
        for (const [from, to] of redirects) {
          if (rest === from || rest.startsWith(`${from}/`)) {
            return NextResponse.redirect(
              new URL(`${to}${req.nextUrl.search}`, req.url),
              307,
            );
          }
        }
      }
      const prefix = `/${l}/nutrition/`;
      if (pathname.startsWith(prefix)) {
        const sub = pathname.slice(prefix.length);
        if (["diary", "body", "diet", "foods", "calorie"].some((s) => sub === s || sub.startsWith(`${s}/`))) {
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
  // Bare-link 307 (temporary): locale prefix only, path + searchParams preserved.
  return NextResponse.redirect(new URL(`/${target}${pathname}${req.nextUrl.search}`, req.url), 307);
}