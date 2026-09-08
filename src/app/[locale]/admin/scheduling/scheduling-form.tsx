"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSlots } from "@/contexts/catalog/actions";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import { toPersianDigits } from "@/components/catalog/doctor-card";

type State = { ok?: boolean; reason?: string; count?: number; message?: string };

const NUMERIC = ["weekday", "durationMinutes", "capacity"];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

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
  locale = "fa",
}: {
  services: { id: string; name: string }[];
  providers: { id: string; name: string }[];
  locale?: string;
}) {
  const tCommon = useTranslations("admin.common");
  const tScheduling = useTranslations("admin.scheduling");
  const tServices = useTranslations("admin.services");

  const [state, formAction] = useActionState<State, FormData>(async (_prev, fd) => {
    try {
      return await generateSlots(toInput(fd) as never);
    } catch (e) {
      return { ok: false, reason: "error", message: (e as Error).message };
    }
  }, {});

  const countDisplay = locale === "en" ? String(state.count ?? 0) : toPersianDigits(state.count ?? 0);

  return (
    <form action={formAction} className="max-w-xl space-y-4 text-start">
      {state.ok === true && (
        <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {tScheduling("createdCount", { count: countDisplay })}
        </p>
      )}
      {state.ok === false && state.reason === "overlap" && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {tScheduling("overlapMessage")}
        </p>
      )}
      {state.ok === false && state.reason === "error" && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p>
      )}
      <label className="block space-y-1 text-sm">
        {tServices("title")}
        <select name="serviceId" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">{tCommon("emptyValue")}</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("provider")}
        <select name="providerId" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">{tCommon("emptyValue")}</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("weekday")}
        <select name="weekday" defaultValue="2" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {WEEKDAYS.map((i) => (
            <option key={i} value={i}>{tScheduling(`weekdays.${i}` as any)}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("timeStart")} <Input type="time" name="startsAt" defaultValue="09:00" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("timeEnd")} <Input type="time" name="endsAt" defaultValue="17:00" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("duration")} <Input type="number" min={1} step={1} name="durationMinutes" defaultValue="60" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("capacity")} <Input type="number" min={1} step={1} name="capacity" defaultValue="1" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("dateFrom")} <JalaliDatePicker locale={locale} name="fromDate" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("dateTo")} <JalaliDatePicker locale={locale} name="toDate" required />
      </label>
      <Button type="submit">{tScheduling("generateSlots")}</Button>
    </form>
  );
}