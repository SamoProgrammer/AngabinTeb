import { listServices } from "@/contexts/catalog/queries";

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; city?: string; serviceType?: string }>;
}) {
  const { locale } = await params;
  const { category, city, serviceType } = await searchParams;
  const services = await listServices(locale, category, city, serviceType);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Services</h1>
      <ul className="divide-y">
        {services.map((s) => (
          <li key={s.id} className="py-4">
            <a href={`/services/${s.id}`}>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-gray-600">{s.providerName} · {s.serviceType}</p>
            </a>
          </li>
        ))}
        {services.length === 0 && <li className="py-8 text-gray-500">No services found.</li>}
      </ul>
    </main>
  );
}