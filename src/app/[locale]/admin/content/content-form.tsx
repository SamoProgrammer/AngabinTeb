"use client";

import { useActionState, useState } from "react";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionResult = { ok?: boolean; id?: string; error?: string };
type Action = (input: FormData) => Promise<ActionResult>;

const KINDS = ["article", "pamphlet", "faq", "video"] as const;

export function ContentForm({
  action,
  initial = {},
  topics,
  currentTopicIds = [],
  locale = "fa",
}: {
  action: Action;
  initial?: Record<string, string>;
  topics: { id: string; name: string }[];
  currentTopicIds?: string[];
  locale?: string;
}) {
  const tCommon = useTranslations("admin.common");
  const tContent = useTranslations("admin.content");

  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(fd);
    if (result.ok) redirect(`/${locale}/admin/content`);
    return result;
  }, {});
  const [kind, setKind] = useState(initial.kind ?? "article");

  return (
    <form action={formAction} className="max-w-xl space-y-4 text-start">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block space-y-1 text-sm">
        {tCommon("kind")}
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {tContent(`kinds.${k}` as any)}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("slug")} <Input name="slug" defaultValue={initial.slug ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("titleFa")} <Input name="titleFa" defaultValue={initial.titleFa ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("bodyFa")}
        <textarea name="bodyFa" defaultValue={initial.bodyFa ?? ""} rows={5} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("titleEn")} <Input name="titleEn" defaultValue={initial.titleEn ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("bodyEn")}
        <textarea name="bodyEn" defaultValue={initial.bodyEn ?? ""} rows={3}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("titleAr")} <Input name="titleAr" defaultValue={initial.titleAr ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("bodyAr")}
        <textarea name="bodyAr" defaultValue={initial.bodyAr ?? ""} rows={3}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        {tContent("videoUrl")} <Input name="videoUrl" defaultValue={initial.videoUrl ?? ""} disabled={kind !== "video"} />
      </label>
      <label className="block space-y-1 text-sm">
        {tCommon("status")}
        <select name="status" defaultValue={initial.status ?? "draft"} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="draft">{tContent("statuses.draft")}</option>
          <option value="published">{tContent("statuses.published")}</option>
        </select>
      </label>
      <fieldset className="space-y-1 text-sm">
        <legend className="font-semibold">{tContent("topics")}</legend>
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-input p-2">
          {topics.map((tItem) => (
            <label key={tItem.id} className="flex items-center gap-2">
              <input type="checkbox" name="topicIds" value={tItem.id} defaultChecked={currentTopicIds.includes(tItem.id)} />
              <span>{tItem.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit">{tCommon("save")}</Button>
    </form>
  );
}