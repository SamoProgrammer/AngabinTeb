import { requireProvider } from "@/contexts/identity/actions";
import { listMyServices } from "@/contexts/catalog/queries";
import { updateMyService } from "@/contexts/catalog/actions";

export default async function ProviderServicesPage() {
  const { providerRow } = await requireProvider();
  const services = await listMyServices(providerRow.id);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My services</h1>
      {services.length === 0 && <p className="text-sm text-gray-500">No active services.</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Duration</th>
            <th className="p-2">Price</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.durationMinutes} min</td>
              <td className="p-2">{s.basePrice}</td>
              <td className="p-2">
                <form action={async (fd: FormData) => { "use server"; await updateMyService(providerRow.id, s.id, {
                  nameFa: String(fd.get("nameFa") ?? ""),
                  durationMinutes: Number(fd.get("durationMinutes")),
                  basePrice: String(fd.get("basePrice") ?? ""),
                }); }} className="flex items-center gap-2">
                  <input name="nameFa" defaultValue={s.name}
                    className="w-40 rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
                  <input name="durationMinutes" type="number" min={1} defaultValue={s.durationMinutes}
                    className="w-20 rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
                  <input name="basePrice" defaultValue={s.basePrice}
                    className="w-24 rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
                  <button type="submit"
                    className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                    Save
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