"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSlots } from "@/contexts/catalog/actions";

type State = { ok?: boolean; reason?: string; count?: number; message?: string };

const NUMERIC = ["weekday", "durationMinutes", "capacity"];

function toInput(fd: FormData): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && v.trim() === "") continue;
    input[k] = NUMERIC.includes(k) ? Number(v) : v;
  }
  return input;
}

export function SchedulingForm({
  services,
  providers,
}: {
  services: { id: string; name: string }[];
  providers: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<State, FormData>(async (_prev, fd) => {
    try {
      return await generateSlots(toInput(fd) as never);
    } catch (e) {
      return { ok: false, reason: "error", message: (e as Error).message };
    }
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.ok === true && (
        <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          Created {state.count} slot{state.count === 1 ? "" : "s"}.
        </p>
      )}
      {state.ok === false && state.reason === "overlap" && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Overlap: {state.count} new slot{state.count === 1 ? "" : "s"} collide with existing slots; nothing was created.
        </p>
      )}
      {state.ok === false && state.reason === "error" && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p>
      )}
      <label className="block space-y-1 text-sm">
        Service
        <select name="serviceId" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Provider
        <select name="providerId" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Weekday
        <select name="weekday" defaultValue="2" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => (
            <option key={d} value={i}>{d} ({i})</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Starts at <Input type="time" name="startsAt" defaultValue="09:00" required />
      </label>
      <label className="block space-y-1 text-sm">
        Ends at <Input type="time" name="endsAt" defaultValue="17:00" required />
      </label>
      <label className="block space-y-1 text-sm">
        Duration (minutes) <Input type="number" min={1} step={1} name="durationMinutes" defaultValue="60" required />
      </label>
      <label className="block space-y-1 text-sm">
        Capacity <Input type="number" min={1} step={1} name="capacity" defaultValue="1" required />
      </label>
      <label className="block space-y-1 text-sm">
        From date <Input type="date" name="fromDate" required />
      </label>
      <label className="block space-y-1 text-sm">
        To date <Input type="date" name="toDate" required />
      </label>
      <Button type="submit">Generate slots</Button>
    </form>
  );
}