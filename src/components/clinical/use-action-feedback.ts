"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { feedbackFor } from "@/lib/feedback";

export interface ActionResult {
  ok: boolean;
  reason?: string;
  error?: string;
}

export function useActionFeedback() {
  const t = useTranslations("feedback");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run<T extends ActionResult>(
    fn: () => Promise<T>,
    opts: { successKey: string; onOk?: (r: T) => void },
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.ok) {
          toast.success(t(opts.successKey));
          opts.onOk?.(res);
          return;
        }
        const fb = feedbackFor(res.reason ?? res.error ?? "");
        const msg = t(fb.key);
        setError(msg);
        if (fb.tone === "warning") toast.warning(msg, { duration: 4000 });
        else toast.error(msg, { duration: 4000 });
      } catch {
        const msg = t("genericError");
        setError(msg);
        toast.error(msg, { duration: 4000 });
      }
    });
  }

  return { pending, error, run, setError };
}
