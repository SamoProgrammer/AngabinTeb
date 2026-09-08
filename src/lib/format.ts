const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function formatPrice(
  price: number | string | null | undefined,
  locale: string = "fa",
): string {
  if (price === null || price === undefined || price === "") return "";
  const str = String(price).trim();
  const isEn = locale === "en";
  const currency = isEn ? "Tomans" : "تومان";
  if (str.includes("تومان") || str.includes("Tomans")) return str;

  const rawNum = typeof price === "number" ? price : parseFloat(str.replace(/[,٬]/g, ""));
  if (isNaN(rawNum)) return str;

  if (isEn) {
    return `${rawNum.toLocaleString("en-US")} ${currency}`;
  }
  const formatted = rawNum
    .toLocaleString("en-US")
    .replace(/\d/g, (x) => PERSIAN_DIGITS[parseInt(x, 10)] ?? x);
  return `${formatted} ${currency}`;
}

// ---------------------------------------------------------------------------
// Jalali (Shamsi) dates + Iran time. Single source of truth: every date/time
// rendered in the app goes through these helpers so all locales show the
// Jalali calendar pinned to Asia/Tehran, independent of server timezone.
// fa → Persian digits, en → Latin digits, ar → Arabic-Indic digits.
// ---------------------------------------------------------------------------

export const TEHRAN_TIME_ZONE = "Asia/Tehran";

export function jalaliLocale(locale: string = "fa"): string {
  if (locale === "en") return "en-u-ca-persian";
  if (locale === "ar") return "ar-IR-u-ca-persian";
  return "fa-IR-u-ca-persian";
}

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatJalaliDate(
  input: DateInput,
  locale: string = "fa",
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(toDate(input));
}

export function formatJalaliTime(
  input: DateInput,
  locale: string = "fa",
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(toDate(input));
}

export function formatJalaliDateTime(
  input: DateInput,
  locale: string = "fa",
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(toDate(input));
}

export function formatJalaliWeekday(
  input: DateInput,
  locale: string = "fa",
  weekday: Intl.DateTimeFormatOptions["weekday"] = "long",
): string {
  return new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    weekday,
  }).format(toDate(input));
}

export function formatJalaliDay(
  input: DateInput,
  locale: string = "fa",
): string {
  return new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    day: "numeric",
  }).format(toDate(input));
}
