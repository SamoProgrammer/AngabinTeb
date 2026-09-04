import type { ReactNode } from "react";
import { requireAdmin } from "@/contexts/identity/actions";
import { AdminShell } from "@/components/admin/admin-shell";

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

  return <AdminShell locale={locale}>{children}</AdminShell>;
}