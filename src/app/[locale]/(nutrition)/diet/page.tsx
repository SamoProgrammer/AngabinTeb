import { requireUser } from "@/contexts/identity/actions";
import { listPrograms, myClaims } from "@/contexts/nutrition/queries";
import { claimDietProgram } from "@/contexts/nutrition/actions";

const CONTEXTS = ["banks", "universities", "health_centers", "clinics", "other"];

export default async function DietPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ context?: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const { context } = await searchParams;
  const selected = CONTEXTS.includes(context ?? "") ? (context as string) : null;
  const programs = selected ? await listPrograms(selected, locale) : [];
  const claims = selected ? await myClaims(user.id) : [];
  const claimedProgramIds = new Set(claims.map((c) => c.programId));

  return (
    <div>
      <h1 className="text-2xl font-bold">Get a diet</h1>
      <form method="GET" className="mt-4 flex max-w-md items-center gap-2">
        <label className="flex flex-1 items-center gap-2">
          Organization context
          <select name="context" defaultValue={selected ?? ""} className="flex-1 rounded border px-3 py-2">
            <option value="">Select…</option>
            {CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white">Show programs</button>
      </form>

      {selected && (
        <div className="mt-8 grid gap-4">
          {programs.length === 0 && <p className="text-gray-500">No programs for this context yet.</p>}
          {programs.map((p) => (
            <div key={p.id} className="rounded border p-4">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              {p.description && <p className="mt-1 text-sm text-gray-600">{p.description}</p>}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div><dt className="text-gray-500">Plan type</dt><dd>{p.planType}</dd></div>
                <div><dt className="text-gray-500">Duration</dt><dd>{p.durationDays} days</dd></div>
                <div><dt className="text-gray-500">Price</dt><dd>{p.price} Toman</dd></div>
                <div><dt className="text-gray-500">Practitioner</dt><dd>{p.practitionerName ?? "—"}{p.practitionerPhone ? ` · ${p.practitionerPhone}` : ""}</dd></div>
              </dl>
              {claimedProgramIds.has(p.id) ? (
                <p className="mt-3 inline-block rounded bg-amber-100 px-3 py-1 text-sm text-amber-800">Pending</p>
              ) : (
                <form action={async (formData) => { await claimDietProgram(formData); }} className="mt-3">
                  <input type="hidden" name="programId" value={p.id} />
                  <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white">Claim</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}