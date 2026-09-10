import type { ReactNode } from "react";
import { requireAdmin } from "@/contexts/identity/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { allClaims } from "@/contexts/nutrition/queries";
import { listRequests } from "@/contexts/support/queries";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: Promise<{ locale?: string }>;
}) {
  await requireAdmin(); // server-side session check; NOT proxy-only (constraint 4)
  const resolved = params ? await params : {};
  const locale = resolved.locale ?? "fa";

  const [claims, openRequests] = await Promise.all([allClaims(), listRequests({ status: "open" })]);
  // ponytail: layout refetches both queues per page; move to cached counts if admin traffic grows.
  const badges = {
    claims: claims.filter((row) => row.status === "needs_review").length,
    support: openRequests.length,
  };

  return (
    <AdminShell locale={locale} badges={badges}>
      {children}
    </AdminShell>
  );
}
