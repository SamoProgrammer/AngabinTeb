export function parseLocale(echoed: string | null | undefined): string {
  const match = echoed?.match(/^\/(fa|en|ar)(\/|$)/);
  return match ? match[1] : "fa";
}

export function isSafeReturn(url: string | null | undefined, locale: string): boolean {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return false;
  if (url !== `/${locale}` && !url.startsWith(`/${locale}/`)) return false;
  if (url.includes("/signin")) return false;
  if (url.includes("/api-test")) return false;
  return true;
}

export function defaultDashboard(locale: string): string {
  return `/${locale}/profile/reservations`;
}

export function toSignin(locale: string, returnTo: string | null | undefined): string {
  if (!isSafeReturn(returnTo, locale)) return `/${locale}/signin`;
  return `/${locale}/signin?returnUrl=${encodeURIComponent(returnTo as string)}`;
}

export function safeReturnOrDefault(raw: string | null | undefined, locale: string): string {
  return isSafeReturn(raw, locale) ? (raw as string) : defaultDashboard(locale);
}
