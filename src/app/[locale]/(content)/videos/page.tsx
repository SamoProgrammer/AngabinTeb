import { listContent } from "@/contexts/content/queries";

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { rows } = await listContent("video", locale);
  return (
    <div>
      <h1 className="text-2xl font-bold">Videos</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map((c) => (
          <li key={c.id} className="rounded border p-4">
            <h2 className="font-medium">{c.title}</h2>
            {c.videoUrl ? (
              <video controls src={c.videoUrl} className="mt-3 w-full rounded" />
            ) : (
              <p className="mt-3 text-sm text-gray-500">No video file yet.</p>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="col-span-full py-4 text-gray-500">No videos yet.</li>}
      </ul>
    </div>
  );
}