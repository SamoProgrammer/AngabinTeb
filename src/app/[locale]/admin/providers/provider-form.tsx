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

export function ProviderForm({
  action,
  initial = {},
  specialties,
  locale = "fa",
}: {
  action: Action;
  initial?: Record<string, string>;
  specialties: { id: string; name: string }[];
  locale?: string;
}) {
  const tCommon = useTranslations("admin.common");
  const tProviders = useTranslations("admin.providers");

  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect(`/${locale}/admin/providers`);
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4 text-start">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        {tProviders("kind")}
        <select name="kind" defaultValue={initial.kind ?? "person"} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="person">{tProviders("kindPerson")}</option>
          <option value="organization">{tProviders("kindOrg")}</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tProviders("orgType")}
        <select name="orgType" defaultValue={initial.orgType ?? ""}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">{tCommon("emptyValue")}</option>
          <option value="clinic">{tProviders("clinic")}</option>
          <option value="office">{tProviders("office")}</option>
          <option value="service_org">{tProviders("serviceOrg")}</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tProviders("nameFa")} <Input name="nameFa" defaultValue={initial.nameFa ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tProviders("nameEn")} <Input name="nameEn" defaultValue={initial.nameEn ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tProviders("nameAr")} <Input name="nameAr" defaultValue={initial.nameAr ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("phone")} <Input name="phone" defaultValue={initial.phone ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tProviders("specialty")}
        <select name="specialtyId" defaultValue={initial.specialtyId ?? ""}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="">{tCommon("emptyValue")}</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tProviders("bioFa")}
        <textarea name="bioFa" defaultValue={initial.bioFa ?? ""} rows={4}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <Button type="submit">{tCommon("save")}</Button>
    </form>
  );
}