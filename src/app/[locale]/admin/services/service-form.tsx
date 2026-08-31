"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionResult = { ok?: boolean; id?: string; error?: string };
type Action = (input: any) => Promise<ActionResult>;

const NUMERIC = ["durationMinutes", "fastingHours"];

function toInput(fd: FormData): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && v.trim() === "") continue;
    input[k] = NUMERIC.includes(k) ? Number(v) : v;
  }
  return input;
}

export function ServiceForm({
  action,
  initial = {},
  providers,
  categories,
  locations,
}: {
  action: Action;
  initial?: Record<string, string>;
  providers: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  locations: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect("/admin/services");
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        Provider
        <select name="providerId" defaultValue={initial.providerId ?? ""} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Category
        <select name="categoryId" defaultValue={initial.categoryId ?? ""} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Service type
        <select name="serviceType" defaultValue={initial.serviceType ?? "diagnostic"} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {["diagnostic", "therapy", "home_care", "rehab", "ambulance", "consultation"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Location
        <select name="locationId" defaultValue={initial.locationId ?? ""}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Name (Persian) <Input name="nameFa" defaultValue={initial.nameFa ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        Name (English) <Input name="nameEn" defaultValue={initial.nameEn ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        Name (Arabic) <Input name="nameAr" defaultValue={initial.nameAr ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        Duration (minutes) <Input type="number" min={1} step={1} name="durationMinutes" defaultValue={initial.durationMinutes ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        Base price <Input type="number" min={0} step={1} name="basePrice" defaultValue={initial.basePrice ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        Prep instructions (Persian)
        <textarea name="prepInstructionsFa" defaultValue={initial.prepInstructionsFa ?? ""} rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        Fasting hours <Input type="number" min={0} step={1} name="fastingHours" defaultValue={initial.fastingHours ?? ""} />
      </label>
      <Button type="submit">Save</Button>
    </form>
  );
}