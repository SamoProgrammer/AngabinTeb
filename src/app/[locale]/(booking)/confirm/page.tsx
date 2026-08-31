export default async function ConfirmPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const { id } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Appointment confirmed</h1>
      <p className="mt-4 text-gray-600">
        Reference: {id}. A reminder will be sent before your visit.
      </p>
      <a href={`/${locale}/appointments`} className="mt-8 inline-block text-emerald-700 underline">
        View my appointments
      </a>
    </main>
  );
}