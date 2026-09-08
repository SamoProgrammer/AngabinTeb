import { redirect } from "next/navigation";

// Legacy mock funnel retired: clinical diet programs are served from the
// database at /nutrition/diet (claim-gated downloads, real prices).
export default async function OfflineDietPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/nutrition/diet`);
}
