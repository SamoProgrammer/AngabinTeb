import { requireUser } from "@/contexts/identity/actions";
import { myAppointments } from "@/contexts/booking/queries";
import { cancelAppointment } from "@/contexts/booking/actions";

export default async function AppointmentsPage() {
  const user = await requireUser();
  const rows = await myAppointments(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold">My appointments</h1>
      <ul className="mt-6 divide-y">
        {rows.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">{a.serviceName}</p>
              <p className="text-sm text-gray-600">
                {new Date(a.startsAt).toLocaleString()} · {a.partySize} pax · {a.status}
              </p>
            </div>
            {a.status === "confirmed" && (
              <form action={async () => { "use server"; await cancelAppointment(a.id); }}>
                <button type="submit" className="rounded border border-red-300 px-4 py-1 text-sm text-red-700">
                  Cancel
                </button>
              </form>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-gray-500">No appointments yet.</li>}
      </ul>
    </div>
  );
}