import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/locales";

// Legacy nutrition/registry URLs → new homes (profile-nutrition relocation).
// All 307 (temporary) with searchParams preserved. Bare (locale-less) legacy
// URLs compose with the bare-link 307 below: first hop adds the locale prefix,
// second hop lands here.
function legacyTarget(rest: string): string | null {
  const path = rest.length > 1 ? rest.replace(/\/+$/, "") : rest;
  // /nutrition/calorie* → /profile/calorie* (remainder preserved)
  if (path === "/nutrition/calorie" || path.startsWith("/nutrition/calorie/")) {
    return `/profile/calorie${path.slice("/nutrition/calorie".length)}`;
  }
  if (path === "/nutrition/body") return "/profile/body";
  // /nutrition/diet/:id → /profile/diets list: the edge can't know the claim
  // state, so the list (one extra click) is correct in all states.
  if (path.startsWith("/nutrition/diet/")) return "/profile/diets";
  if (path === "/nutrition/diet") return "/diet";
  if (path === "/nutrition") return "/profile";
  // /registry was never a tracked route (empty stub dirs only) but bookmarks
  // may exist; /registry/form/* was the clinical dossier, now /profile/clinical.
  if (path === "/registry" || path.startsWith("/registry/")) {
    return "/profile/clinical";
  }
  return null;
}

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
    const target = legacyTarget(rest);
    if (target) {
      return NextResponse.redirect(
        new URL(`/${locale}${target}${req.nextUrl.search}`, req.url),
        307,
      );
    }
    const guarded = ["/profile", "/admin", "/support", "/diet/payment", "/diet/check"];
    if (guarded.some((g) => rest === g || rest.startsWith(`${g}/`))) {
      const echo = new Headers(req.headers);
      echo.set("x-auth-return", `${pathname}${req.nextUrl.search}`);
      return NextResponse.next({ request: { headers: echo } });
    }
    return NextResponse.next();
  }

  const accept = req.headers.get("accept-language") ?? "";
  const preferred = locales.find((l) => accept.toLowerCase().includes(l));
  const target = preferred ?? defaultLocale;
  // Bare-link 307 (temporary): locale prefix only, path + searchParams preserved.
  return NextResponse.redirect(new URL(`/${target}${pathname}${req.nextUrl.search}`, req.url), 307);
}