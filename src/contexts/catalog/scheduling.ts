export function expandPattern(input: {
  weekday: number; // 0=Sun … 6=Sat
  startsAt: string; // "HH:MM"
  endsAt: string;
  durationMinutes: number;
  from: Date;
  to: Date;
}): Date[] {
  const [sh, sm] = input.startsAt.split(":").map(Number);
  const [eh, em] = input.endsAt.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) throw new Error("endsAt must be after startsAt");
  const out: Date[] = [];
  for (let d = new Date(input.from); d <= input.to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== input.weekday) continue;
    for (let m = startMin; m + input.durationMinutes <= endMin; m += input.durationMinutes) {
      const slot = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(m / 60), m % 60));
      out.push(slot);
    }
  }
  return out;
}
