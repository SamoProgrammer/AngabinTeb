"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generateMySlots } from "@/contexts/catalog/actions";

type State = { ok?: boolean; reason?: string; count?: number; error?: string };

function toInput(fd: FormData) {
  return {
    serviceId: String(fd.get("serviceId") ?? ""),
    weekday: Number(fd.get("weekday")),
    startsAt: String(fd.get("start") ?? ""),
    endsAt: String(fd.get("end") ?? ""),
    fromDate: String(fd.get("fromDate") ?? ""),
    toDate: String(fd.get("toDate") ?? ""),
    durationMinutes: 30,
    capacity: 1,
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SlotForm({
  services,
  providerId,
}: {
  services: { id: string; name: string }[];
  providerId: string;
}) {
  const [state, formAction] = useActionState<State, FormData>(async (_prev, fd) => {
    try {
      return await generateMySlots(providerId, toInput(fd));
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, {});
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const fromDate = iso(today);
  const toDate = iso(new Date(today.getTime() + 13 * 86400_000));

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.ok === true && (
        <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          Generated {state.count} slots.
        </p>
      )}
      {state.ok === false && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error ?? state.reason ?? "Something went wrong."}
        </p>
      )}
      <label className="block space-y-1 text-sm">
        Service
        <select name="serviceId" defaultValue={services[0]?.id} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label htmlFor="weekday" className="block space-y-1 text-sm">
        Weekday
        <select id="weekday" name="weekday" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {WEEKDAYS.map((d, i) => (
            <option key={d} value={i}>{d}</option>
          ))}
        </select>
      </label>
      <label htmlFor="start" className="block space-y-1 text-sm">
        Start <input type="time" id="start" name="start" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
      </label>
      <label htmlFor="end" className="block space-y-1 text-sm">
        End <input type="time" id="end" name="end" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
      </label>
      <input type="hidden" name="fromDate" value={fromDate} />
      <input type="hidden" name="toDate" value={toDate} />
      <Button type="submit">Generate slots</Button>
    </form>
  );
}