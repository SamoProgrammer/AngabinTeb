import { requireProvider } from "@/contexts/identity/actions";
import { listMyServices, listMySlots } from "@/contexts/catalog/queries";
import { deactivateSlot } from "@/contexts/catalog/actions";
import { SlotForm } from "./slot-form";

export default async function ProviderSchedulePage() {
  const { providerRow } = await requireProvider();
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400_000);
  const [services, slots] = await Promise.all([
    listMyServices(providerRow.id),
    listMySlots(providerRow.id, weekStart, weekEnd),
  ]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Schedule</h1>
      {services.length === 0 ? (
        <p className="text-sm text-gray-500">No active services yet.</p>
      ) : (
        <SlotForm services={services} providerId={providerRow.id} />
      )}
      <h2 className="mt-8 mb-4 text-lg font-semibold">Slots this week</h2>
      {slots.length === 0 && <p className="text-sm text-gray-500">No slots this week.</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Start</th>
            <th className="p-2">End</th>
            <th className="p-2">Service</th>
            <th className="p-2">Capacity</th>
            <th className="p-2">Booked</th>
            <th className="p-2">Active</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{new Date(s.startsAt).toLocaleString()}</td>
              <td className="p-2">{new Date(s.endsAt).toLocaleString()}</td>
              <td className="p-2">{s.serviceName}</td>
              <td className="p-2">{s.capacity}</td>
              <td className="p-2">{s.bookedCount}</td>
              <td className="p-2">{s.isActive ? "Yes" : "No"}</td>
              <td className="p-2">
                <form action={async () => { "use server"; await deactivateSlot(s.id, providerRow.id); }}>
                  <button type="submit"
                    className="rounded-lg bg-red-700 px-3 py-1 text-sm font-medium text-white hover:bg-red-800">
                    Cancel
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}