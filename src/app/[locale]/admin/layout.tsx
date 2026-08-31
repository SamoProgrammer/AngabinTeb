import type { ReactNode } from "react";
import { requireAdmin } from "@/contexts/identity/actions";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin(); // server-side session check; NOT proxy-only (constraint 4)
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-e p-4">
        <nav className="flex flex-col gap-2">
          <a href="/admin" className="font-semibold">Overview</a>
        </nav>
        <div className="mt-8"><LocaleSwitcher /></div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}