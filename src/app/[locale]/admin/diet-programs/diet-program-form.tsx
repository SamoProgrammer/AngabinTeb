"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { PendingAdminButton } from "@/components/clinical/pending-admin-button";
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

export function DietProgramForm({ action, locale = "fa" }: { action: Action; locale?: string }) {
  const tCommon = useTranslations("admin.common");
  const tDiet = useTranslations("admin.dietPrograms");
  const tCat = useTranslations("admin.categories");

  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect(`/${locale}/admin/diet-programs`);
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4 text-start">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        {tCat("nameFa")} <Input name="nameFa" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCat("nameEn")} <Input name="nameEn" />
      </label>
      <label className="block space-y-1 text-sm">
        {tCat("nameAr")} <Input name="nameAr" />
      </label>
      <label className="block space-y-1 text-sm">
        {tDiet("context")}
        <select name="organizationContext" defaultValue="banks" required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {(["banks", "universities", "health_centers", "clinics", "other"] as const).map((c) => (
            <option key={c} value={c}>{tDiet(`contexts.${c}`)}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tDiet("planType")} <Input name="planType" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tDiet("durationDays")} <Input type="number" min={1} step={1} name="durationDays" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("price")} <Input type="number" min={0} step={1} name="price" required />
      </label>
      <label className="block space-y-1 text-sm">
        {tDiet("descFa")}
        <textarea name="descriptionFa" rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        {tDiet("descEn")}
        <textarea name="descriptionEn" rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        {tDiet("descAr")}
        <textarea name="descriptionAr" rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <PendingAdminButton>{tDiet("createBtn")}</PendingAdminButton>
    </form>
  );
}