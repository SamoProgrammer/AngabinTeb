// Pure helpers only (no "use server", no db) — actions import these.

export interface ScheduleRow {
  providerId: string; serviceId: string; weekday: number;
  startTime: string; endTime: string; durationMinutes: number;
  capacity: number; isActive: boolean;
}

export interface ExceptionRow {
  providerId: string; serviceId: string | null; exceptionDate: string; // YYYY-MM-DD
}

const HHMM = /^\d{2}:\d{2}$/;

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function validateScheduleInput(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  const v = input as Record<string, unknown>;
  if (typeof v.weekday !== "number" || !Number.isInteger(v.weekday) || v.weekday < 0 || v.weekday > 6) return false;
  if (typeof v.startTime !== "string" || !HHMM.test(v.startTime)) return false;
  if (typeof v.endTime !== "string" || !HHMM.test(v.endTime)) return false;
  if (toMin(v.endTime as string) <= toMin(v.startTime as string)) return false;
  if (typeof v.durationMinutes !== "number" || !Number.isInteger(v.durationMinutes) || v.durationMinutes < 5) return false;
  if (typeof v.capacity !== "number" || !Number.isInteger(v.capacity) || v.capacity < 1) return false;
  return true;
}

export function isClosedDay(exceptions: ExceptionRow[], providerId: string, serviceId: string, ymd: string): boolean {
  return exceptions.some((e) =>
    e.providerId === providerId &&
    e.exceptionDate === ymd &&
    (e.serviceId === null || e.serviceId === serviceId),
  );
}

export function expandSchedules(schedules: ScheduleRow[], exceptions: ExceptionRow[], fromYmd: string, toYmd: string): Date[] {
  const out: Date[] = [];
  const from = new Date(`${fromYmd}T00:00:00Z`);
  const to = new Date(`${toYmd}T23:59:59Z`);
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400000)) {
    const ymd = d.toISOString().slice(0, 10);
    for (const s of schedules) {
      if (!s.isActive) continue;
      if (d.getUTCDay() !== s.weekday) continue;
      if (isClosedDay(exceptions, s.providerId, s.serviceId, ymd)) continue;
      const startMin = toMin(s.startTime);
      const endMin = toMin(s.endTime);
      for (let m = startMin; m + s.durationMinutes <= endMin; m += s.durationMinutes) {
        out.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(m / 60), m % 60)));
      }
    }
  }
  return out;
}
