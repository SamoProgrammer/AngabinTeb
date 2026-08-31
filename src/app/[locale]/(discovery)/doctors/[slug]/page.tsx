import { getDoctor } from "@/contexts/catalog/queries";
import { Button } from "@/components/ui/button";

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const doctor = await getDoctor(slug, locale);
  if (!doctor) return <p>Not found</p>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start gap-6">
        {doctor.imageUrl && (
          <img src={doctor.imageUrl} alt={doctor.name as string}
               className="h-40 w-40 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{doctor.name}</h1>
          <p className="mt-1 text-emerald-700">{doctor.specialtyName}</p>
          {doctor.credentials && <p className="mt-2 text-sm text-gray-600">{doctor.credentials}</p>}
        </div>
      </div>
      {doctor.bio && <p className="mt-8 leading-relaxed">{doctor.bio}</p>}
      <div className="mt-8 rounded border p-4">
        <p><strong>Address:</strong> {doctor.addressLine ?? "—"}</p>
        <p className="mt-1"><strong>Phone:</strong> {doctor.phone ?? "—"}</p>
        {doctor.latitude && doctor.longitude && (
          <a
            className="mt-2 inline-block text-emerald-700 underline"
            href={`https://www.openstreetmap.org/?mlat=${doctor.latitude}&mlon=${doctor.longitude}#map=16/${doctor.latitude}/${doctor.longitude}`}
            target="_blank" rel="noreferrer"
          >
            View on map
          </a>
        )}
        {doctor.cvUrl && <a className="mt-2 block text-emerald-700 underline" href={doctor.cvUrl}>CV</a>}
        {doctor.videoUrl && <a className="mt-2 block text-emerald-700 underline" href={doctor.videoUrl}>Video</a>}
      </div>
      <Button render={<a href="/services" />} className="mt-8">Book with this doctor</Button>
    </main>
  );
}