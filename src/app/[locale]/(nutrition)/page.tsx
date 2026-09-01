export default function NutritionHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Nutrition workspace</h1>
      <ul className="mt-4 grid max-w-md gap-2">
        <li><a href="/body" className="text-emerald-700 underline">My Body</a></li>
        <li><a href="/diary" className="text-emerald-700 underline">Food diary</a></li>
        <li><a href="/foods" className="text-emerald-700 underline">Food database</a></li>
        <li><a href="/diet" className="text-emerald-700 underline">Get a diet</a></li>
      </ul>
    </div>
  );
}