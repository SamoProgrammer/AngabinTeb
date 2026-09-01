import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology } from "@/contexts/nutrition/queries";
import { savePhysiology } from "@/contexts/nutrition/actions";

export default async function BodyPage() {
  const user = await requireUser();
  const profile = await getPhysiology(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold">My Body</h1>
      {profile && (
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">Age</dt><dd>{profile.age}</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">Height</dt><dd>{profile.heightCm} cm</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">Weight</dt><dd>{profile.weightKg} kg</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">BMR</dt><dd>{profile.bmr} kcal</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">TDEE</dt><dd>{profile.tdee} kcal</dd></div>
        </dl>
      )}
      <form action={async (formData) => { await savePhysiology(formData); }} className="mt-8 grid max-w-md gap-4">
        <label className="flex items-center gap-2">
          Sex
          <select name="sex" defaultValue={profile?.sex ?? "male"} className="flex-1 rounded border px-3 py-2">
            <option value="male">Male</option><option value="female">Female</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Birth date
          <input name="birthDate" type="date" defaultValue={profile?.birthDate} required className="flex-1 rounded border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          Height (cm)
          <input name="heightCm" type="number" defaultValue={profile?.heightCm} required className="flex-1 rounded border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          Weight (kg)
          <input name="weightKg" type="number" defaultValue={profile?.weightKg} required className="flex-1 rounded border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          Activity
          <select name="activityLevel" defaultValue={profile?.activityLevel ?? "moderate"} className="flex-1 rounded border px-3 py-2">
            {["sedentary","light","moderate","active","very_active"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Save</button>
      </form>
    </div>
  );
}