import { getService, homeCareInfo } from "@/contexts/catalog/queries";
import { availabilityForService } from "@/contexts/catalog/actions";
import { SlotPicker } from "@/components/booking/slot-picker";

export default async function BookPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale, slug } = await params;
  const { date } = await searchParams;
  const service = await getService(slug, locale);
  if (!service) return <p>Not found</p>;
  const day = date ?? new Date().toISOString().slice(0, 10);
  const slots = await availabilityForService(slug, day);
  const satellite = service.serviceType === "home_care" ? await homeCareInfo(service.id) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">{service.name}</h1>
      <p className="mt-1 text-gray-600">{service.providerName} · {service.durationMinutes} min</p>
      <p className="mt-4 text-lg">{service.basePrice} Toman</p>

      <form className="mt-8" action={`/${locale}/services/${slug}/book`}>
        <label className="block" htmlFor="date">Date</label>
        <input id="date" type="date" name="date" defaultValue={day}
               className="mb-6 rounded border px-3 py-2" />
      </form>

      <SlotPicker slots={slots.map((s) => ({
        id: s.id, startsAt: s.startsAt.toISOString(),
        capacity: s.capacity, bookedCount: s.bookedCount,
      }))} serviceId={slug} {...(satellite ? { homeCare: { serviceableCityIds: satellite.serviceableCityIds } } : {})} />
    </main>
  );
}