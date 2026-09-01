import { listRequests } from "@/contexts/support/queries";
import { updateRequestStatus } from "@/contexts/support/actions";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;

export default async function AdminSupportPage() {
  const rows = await listRequests("open");
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Support queue</h1>
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
              {new Date(r.createdAt).toLocaleString()} · user {r.userId.slice(0, 8)}
            </p>
            <form action={async (fd: FormData) => { "use server"; await updateRequestStatus(r.id, fd); }} className="mt-3 flex items-center gap-2">
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
          </li>
        ))}
      </ul>
    </div>
  );
}