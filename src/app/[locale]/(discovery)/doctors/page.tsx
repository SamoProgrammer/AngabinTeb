import { listDoctors } from "@/contexts/catalog/queries";

export default async function DoctorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ specialty?: string; city?: string }>;
}) {
  const { locale } = await params;
  const { specialty, city } = await searchParams;
  const doctors = await listDoctors(locale, specialty, city);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Doctors</h1>
      <ul className="divide-y">
        {doctors.map((d) => (
          <li key={d.id} className="py-4">
            <a href={`/doctors/${d.id}`}>
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-gray-600">{d.specialty}</p>
            </a>
          </li>
        ))}
        {doctors.length === 0 && <li className="py-8 text-gray-500">No doctors found.</li>}
      </ul>
    </main>
  );
}