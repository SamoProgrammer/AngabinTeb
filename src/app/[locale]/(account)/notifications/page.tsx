import { requireUser } from "@/contexts/identity/actions";
import { listNotifications } from "@/contexts/support/queries";
import { markNotificationsRead } from "@/contexts/support/actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await listNotifications(user.id);
  const unread = rows.filter((n) => !n.read);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread.length > 0 && (
          <form action={markNotificationsRead}>
            <button type="submit" className="rounded border border-gray-300 px-4 py-1 text-sm">
              Mark all read
            </button>
          </form>
        )}
      </div>
      <ul className="mt-6 divide-y">
        {rows.map((n) => (
          <li key={n.id} className={`flex items-start justify-between py-4 ${!n.read ? "font-semibold" : ""}`}>
            <div>
              <p>{n.title}</p>
              <p className="text-sm text-gray-600">{n.body}</p>
              <p className="text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleString()} · {n.kind}
              </p>
            </div>
            {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-gray-500">No notifications yet.</li>}
      </ul>
    </div>
  );
}