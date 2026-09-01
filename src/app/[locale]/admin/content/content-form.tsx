"use client";

import { useActionState, useState } from "react";
import { redirect } from "next/navigation";
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
}: {
  action: Action;
  initial?: Record<string, string>;
  topics: { id: string; name: string }[];
  currentTopicIds?: string[];
}) {
  const [state, formAction] = useActionState(async (_prev: ActionResult, fd: FormData) => {
    const result = await action(fd);
    if (result.ok) redirect("/admin/content");
    return result;
  }, {});
  const [kind, setKind] = useState(initial.kind ?? "article");

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block space-y-1 text-sm">
        Kind
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          {KINDS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        Slug <Input name="slug" defaultValue={initial.slug ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        Title (Persian) <Input name="titleFa" defaultValue={initial.titleFa ?? ""} required />
      </label>
      <label className="block space-y-1 text-sm">
        Body (Persian)
        <textarea name="bodyFa" defaultValue={initial.bodyFa ?? ""} rows={5} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        Title (English) <Input name="titleEn" defaultValue={initial.titleEn ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        Body (English)
        <textarea name="bodyEn" defaultValue={initial.bodyEn ?? ""} rows={3}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        Title (Arabic) <Input name="titleAr" defaultValue={initial.titleAr ?? ""} />
      </label>
      <label className="block space-y-1 text-sm">
        Body (Arabic)
        <textarea name="bodyAr" defaultValue={initial.bodyAr ?? ""} rows={3}
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm" />
      </label>
      <label className="block space-y-1 text-sm">
        Video URL <Input name="videoUrl" defaultValue={initial.videoUrl ?? ""} disabled={kind !== "video"} />
      </label>
      <label className="block space-y-1 text-sm">
        Status
        <select name="status" defaultValue={initial.status ?? "draft"} required
          className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </label>
      <fieldset className="space-y-1 text-sm">
        <legend>Topics</legend>
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-input p-2">
          {topics.map((t) => (
            <label key={t.id} className="flex items-center gap-2">
              <input type="checkbox" name="topicIds" value={t.id} defaultChecked={currentTopicIds.includes(t.id)} />
              <span>{t.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit">Save</Button>
    </form>
  );
}