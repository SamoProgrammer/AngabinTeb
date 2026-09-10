import { getTranslations } from "next-intl/server";
import { listRequests } from "@/contexts/support/queries";
import { updateRequestStatus } from "@/contexts/support/actions";
import { PendingButton } from "@/components/clinical/pending-button";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDateTime } from "@/lib/format";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;

export default async function AdminSupportPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";

  const tSupport = await getTranslations("admin.support");
  const rows = await listRequests({ status: "open" });

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tSupport("title")}</h1>
      {rows.length === 0 && <p className="text-muted-foreground">{tSupport("empty")}</p>}
      <ul className="space-y-4">
        {rows.map((r) => {
          const formattedDate = formatJalaliDateTime(r.createdAt, locale);

          return (
            <li key={r.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-on-surface">{r.subject}</p>
                <div className="flex gap-2">
                  <Badge>{r.kind}</Badge>
                  <Badge variant={r.priority === "high" ? "destructive" : "secondary"}>{r.priority}</Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">{r.body}</p>
              <p className="mt-2 text-xs text-outline">
                {formattedDate} · {tSupport("userPrefix")} {r.userId.slice(0, 8)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <form
                  action={async (fd: FormData) => {
                    "use server";
                    await updateRequestStatus(r.id, fd);
                  }}
                  className="flex items-center gap-2"
                >
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-2.5 py-1.5 text-sm outline-none"
                  >
                    {STATUS_OPTIONS.map((statusKey) => (
                      <option key={statusKey} value={statusKey}>
                        {tSupport(`statuses.${statusKey}` as any)}
                      </option>
                    ))}
                  </select>
                  <PendingButton
                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-container cursor-pointer"
                  >
                    {tSupport("updateBtn")}
                  </PendingButton>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
