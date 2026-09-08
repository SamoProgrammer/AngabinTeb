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

export function CategoryForm({
  action,
  initial = {},
  locale = "fa",
}: {
  action: Action;
  initial?: Record<string, string>;
  locale?: string;
}) {
  const tCommon = useTranslations("admin.common");
  const tCategories = useTranslations("admin.categories");

  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(toInput(fd));
    if (result.ok) redirect(`/${locale}/admin/categories`);
    return result;
  }, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4 text-start">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <label className="block space-y-1 text-sm">
        {tCommon("slug")} <Input name="slug" defaultValue={initial.slug ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCategories("nameFa")} <Input name="nameFa" defaultValue={initial.nameFa ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tCategories("nameEn")} <Input name="nameEn" defaultValue={initial.nameEn ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tCategories("nameAr")} <Input name="nameAr" defaultValue={initial.nameAr ?? ""} />
      </label>
      <Button type="submit">{tCommon("save")}</Button>
    </form>
  );
}