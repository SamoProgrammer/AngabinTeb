"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionResult = { ok?: boolean; id?: string; error?: string };
type Action = (input: any) => Promise<ActionResult>;

function toInput(fd: FormData): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && v.trim() === "") continue;
    input[k] = v;
  }
  return input;
}

export function ProviderForm({
  action,
  initial = {},
  specialties,
}: {
  action: Action;
  initial?: Record<string, string>;
  specialties: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect("/admin/providers");
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        Kind
        <select name="kind" defaultValue={initial.kind ?? "person"} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="person">Person</option>
          <option value="organization">Organization</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Org type
        <select name="orgType" defaultValue={initial.orgType ?? ""}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          <option value="clinic">Clinic</option>
          <option value="office">Office</option>
          <option value="service_org">Service org</option>
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
        Phone <Input name="phone" defaultValue={initial.phone ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        Specialty
        <select name="specialtyId" defaultValue={initial.specialtyId ?? ""}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">—</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Bio (Persian)
        <textarea name="bioFa" defaultValue={initial.bioFa ?? ""} rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <Button type="submit">Save</Button>
    </form>
  );
}