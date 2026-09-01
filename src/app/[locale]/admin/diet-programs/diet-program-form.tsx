"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionResult = { ok?: boolean; id?: string; error?: string };
type Action = (input: any) => Promise<ActionResult>;

const NUMERIC = ["durationDays"];

function toInput(fd: FormData): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && v.trim() === "") continue;
    input[k] = NUMERIC.includes(k) ? Number(v) : v;
  }
  return input;
}

export function DietProgramForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect("/admin/diet-programs");
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        Name (Persian) <Input name="nameFa" required />
      </label>
      <label className="block space-y-1 text-sm">
        Name (English) <Input name="nameEn" />
      </label>
      <label className="block space-y-1 text-sm">
        Name (Arabic) <Input name="nameAr" />
      </label>
      <label className="block space-y-1 text-sm">
        Organization context
        <select name="organizationContext" defaultValue="banks" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {["banks", "universities", "health_centers", "clinics", "other"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Plan type <Input name="planType" required />
      </label>
      <label className="block space-y-1 text-sm">
        Duration (days) <Input type="number" min={1} step={1} name="durationDays" required />
      </label>
      <label className="block space-y-1 text-sm">
        Price <Input type="number" min={0} step={1} name="price" required />
      </label>
      <label className="block space-y-1 text-sm">
        Description (Persian)
        <textarea name="descriptionFa" rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        Description (English)
        <textarea name="descriptionEn" rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        Description (Arabic)
        <textarea name="descriptionAr" rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <Button type="submit">Create</Button>
    </form>
  );
}