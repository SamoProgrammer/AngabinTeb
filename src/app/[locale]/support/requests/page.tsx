import { requireUser } from "@/contexts/identity/actions";
import { myRequests } from "@/contexts/support/queries";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "destructive",
};

export default async function MyRequestsPage() {
  const user = await requireUser();
  const rows = await myRequests(user.id);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">My support requests</h1>
      <ul className="mt-6 space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.subject}</p>
              <Badge variant={STATUS_VARIANTS[r.status] ?? "default"}>{r.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-gray-500">{r.kind}</p>
            <p className="mt-2 text-sm text-gray-600">{r.body}</p>
            <p className="mt-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-gray-500">No support requests yet.</li>}
      </ul>
    </main>
  );
}