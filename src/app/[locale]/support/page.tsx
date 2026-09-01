export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cards = [
    { kind: "question", title: "Ask a question", description: "Get answers about services, bookings, and more." },
    { kind: "complaint", title: "Register a complaint", description: "Tell us about a problem you experienced." },
    { kind: "appointment_issue", title: "Appointment issue", description: "Report a problem with a specific appointment." },
  ] as const;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold">Support center</h1>
      <p className="mt-2 text-gray-600">How can we help you today?</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <a key={c.kind} href={`/${locale}/support/new?kind=${c.kind}`}
            className="rounded-xl border p-6 transition-colors hover:bg-gray-50">
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{c.description}</p>
          </a>
        ))}
      </div>
      <a href={`/${locale}/support/requests`} className="mt-8 inline-block text-emerald-700 underline">
        View my requests
      </a>
    </main>
  );
}