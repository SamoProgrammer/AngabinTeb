"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
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

export function LocationForm({
  action,
  initial = {},
  providers,
  locale = "fa",
}: {
  action: Action;
  initial?: Record<string, string>;
  providers: { id: string; name: string }[];
  locale?: string;
}) {
  const tCommon = useTranslations("admin.common");
  const tLocations = useTranslations("admin.locations");

  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect(`/${locale}/admin/locations`);
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4 text-start">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        {tCommon("provider")}
        <select name="providerId" defaultValue={initial.providerId ?? ""} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">{tCommon("emptyValue")}</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tLocations("labelFa")} <Input name="label" defaultValue={initial.label ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tLocations("labelEn")} <Input name="labelEn" defaultValue={initial.labelEn ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tLocations("labelAr")} <Input name="labelAr" defaultValue={initial.labelAr ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tLocations("addressLine")} <Input name="addressLine" defaultValue={initial.addressLine ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("city")} <Input name="cityId" defaultValue={initial.cityId ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("phone")} <Input name="phone" defaultValue={initial.phone ?? ""} />
      </label>
      <Button type="submit">{tCommon("save")}</Button>
    </form>
  );
}