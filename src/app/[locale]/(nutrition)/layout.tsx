import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";

export default async function NutritionLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <a href="/body" className="text-emerald-700 underline">My Body</a>
        <a href="/diary" className="text-emerald-700 underline">Food diary</a>
        <a href="/foods" className="text-emerald-700 underline">Food database</a>
        <a href="/diet" className="text-emerald-700 underline">Get a diet</a>
      </nav>
      {children}
    </main>
  );
}