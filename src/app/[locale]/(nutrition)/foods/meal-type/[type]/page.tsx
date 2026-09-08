import { redirect } from "next/navigation";

// Static recipe collection retired (invented macros, no DB backing):
// the Persian food database at /nutrition/foods is the source of truth.
export default async function MealTypePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/nutrition/foods`);
}
