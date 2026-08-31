import { getService } from "@/contexts/catalog/queries";
import { getPrepInfo } from "@/contexts/catalog/queries";
import { Button } from "@/components/ui/button";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = await getService(slug, locale);
  if (!service) return <p>Not found</p>;
  const prep = service.serviceType === "diagnostic" ? await getPrepInfo(service.id) : null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{service.name}</h1>
      <p className="mt-2 text-gray-600">{service.providerName}</p>
      <dl className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded border p-4"><dt className="text-sm text-gray-500">Duration</dt><dd>{service.durationMinutes} min</dd></div>
        <div className="rounded border p-4"><dt className="text-sm text-gray-500">Price</dt><dd>{service.basePrice} Toman</dd></div>
      </dl>
      {prep && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold">Preparation</h2>
          <p className="mt-1 text-sm">{prep.prepInstructions ?? "Follow your provider's instructions."}</p>
        </div>
      )}
      <Button render={<a href={`/services/${slug}/book`} />} className="mt-8">Book this service</Button>
    </main>
  );
}