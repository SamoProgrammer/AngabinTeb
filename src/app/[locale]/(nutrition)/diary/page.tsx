import { requireUser } from "@/contexts/identity/actions";
import { dayIntake, foodPickerOptions } from "@/contexts/nutrition/queries";
import { LogFood } from "@/components/nutrition/log-food";

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export default async function DiaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { locale } = await params;
  const { day: dayParam } = await searchParams;
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const day = dayParam && dayPattern.test(dayParam) ? dayParam : today;
  const [{ intakes, totals }, options] = await Promise.all([
    dayIntake(user.id, day),
    foodPickerOptions(locale),
  ]);

  const cards = [
    { label: "Energy", value: totals["n-energy"] ?? 0 },
    { label: "Carbs", value: totals["n-carbs"] ?? 0 },
    { label: "Protein", value: totals["n-protein"] ?? 0 },
    { label: "Fat", value: totals["n-fat"] ?? 0 },
  ];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Food diary</h1>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded border p-4">
            <dt className="text-sm text-gray-500">{c.label}</dt>
            <dd>{c.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-8 divide-y">
        {intakes.map((i) => (
          <li key={i.id} className="py-4">
            <span className="font-medium">{i.foodName}</span>
            <span className="text-gray-500"> — {i.servingUnitName} × {i.quantity} — {i.loggedAt.toLocaleString()}</span>
          </li>
        ))}
        {intakes.length === 0 && <li className="py-4 text-gray-500">No intakes logged for this day.</li>}
      </ul>
      <LogFood foods={options} />
      <nav className="mt-8 flex flex-wrap gap-4 text-sm">
        {days.map((d) => (
          <a key={d} href={`/diary?day=${d}`} className="text-emerald-700 underline">{d}</a>
        ))}
      </nav>
    </div>
  );
}