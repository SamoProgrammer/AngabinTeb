import { listRequests, listAdminUsers } from "@/contexts/support/queries";
import { updateRequestStatus, assignRequest, updateRequestPriority } from "@/contexts/support/actions";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITY_OPTIONS = ["normal", "high"] as const;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string }>;
}) {
  const { priority } = await searchParams;
  const rows = await listRequests("open", priority && priority !== "all" ? priority : undefined);
  const admins = await listAdminUsers();
  const adminNames = new Map(admins.map((a) => [a.id, a.name]));
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Support queue</h1>
      <form className="mb-4 flex items-center gap-2">
        <select
          name="priority"
          defaultValue={priority ?? "all"}
          className="rounded-md border px-2 py-1"
        >
          <option value="all">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
          Filter
        </button>
      </form>
      {rows.length === 0 && <p className="text-gray-500">No open requests.</p>}
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.subject}</p>
              <div className="flex gap-2">
                <Badge>{r.kind}</Badge>
                <Badge variant={r.priority === "high" ? "destructive" : "secondary"}>{r.priority}</Badge>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{r.body}</p>
            <p className="mt-2 text-xs text-gray-400">
              {new Date(r.createdAt).toLocaleString()} · user {r.userId.slice(0, 8)} · assigned to{" "}
              {r.assigneeUserId ? (adminNames.get(r.assigneeUserId) ?? r.assigneeUserId.slice(0, 8)) : "Unassigned"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <form action={async (fd: FormData) => { "use server"; await updateRequestStatus(r.id, fd); }} className="flex items-center gap-2">
                <select name="status" defaultValue={r.status}
                  className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                  Update
                </button>
              </form>
              <form action={async (fd: FormData) => { "use server"; await assignRequest(r.id, String(fd.get("assignee") ?? "")); }} className="flex items-center gap-2">
                <label htmlFor={`assignee-${r.id}`} className="text-xs text-gray-500">Assignee</label>
                <select name="assignee" id={`assignee-${r.id}`} defaultValue={r.assigneeUserId ?? ""}
                  className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none">
                  <option value="">Unassigned</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <button type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                  Assign
                </button>
              </form>
              <form action={async (fd: FormData) => { "use server"; await updateRequestPriority(r.id, String(fd.get("priority") ?? "") as "normal" | "high"); }} className="flex items-center gap-2">
                <select name="priority" defaultValue={r.priority}
                  className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none">
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                  Set priority
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
