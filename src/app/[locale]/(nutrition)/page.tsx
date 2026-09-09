import { redirect } from "next/navigation";

export default async function NutritionHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/nutrition/calorie`);
}
