import { TEHRAN_TIME_ZONE } from "./format";

// Pure Jalali-calendar math, driven entirely by the Intl Persian calendar —
// no conversion tables, no new dependency. All computation uses noon-UTC
// anchors so the Tehran wall date never shifts under arithmetic.

const COMPUTE_LOCALE = "en-u-ca-persian";
const DAY_MS = 86_400_000;

const partsFormatter = new Intl.DateTimeFormat(COMPUTE_LOCALE, {
  timeZone: TEHRAN_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export interface JalaliParts {
  jy: number;
  jm: number;
  jd: number;
}

export function jalaliParts(date: Date): JalaliParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(date)) {
    if (p.type === "year" || p.type === "month" || p.type === "day") {
      out[p.type] = Number(p.value);
    }
  }
  return { jy: out.year, jm: out.month, jd: out.day };
}

/** Noon-UTC anchor for a Gregorian calendar day (Tehran-safe). */
export function noonUtc(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY_MS);
}

export function gregorianIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Tehran "today" as Gregorian yyyy-mm-dd. */
export function tehranTodayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Parse Gregorian yyyy-mm-dd (backend contract) to a noon-UTC anchor. */
export function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = noonUtc(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Gregorian anchor of the 1st day of the Jalali month containing `ref`. */
export function jalaliMonthStart(ref: Date): Date {
  let d = new Date(ref.getTime());
  for (let i = 0; i < 31; i++) {
    if (jalaliParts(d).jd === 1) return d;
    d = addDays(d, -1);
  }
  return d;
}

export function jalaliMonthLength(monthStart: Date): number {
  const { jm } = jalaliParts(monthStart);
  let len = 1;
  for (let i = 1; i < 31; i++) {
    if (jalaliParts(addDays(monthStart, i)).jm !== jm) break;
    len = i + 1;
  }
  return len;
}

/** 0-based index into a Saturday-first week row for a noon-UTC anchor. */
export function saturdayFirstIndex(date: Date): number {
  return (date.getUTCDay() + 1) % 7;
}
