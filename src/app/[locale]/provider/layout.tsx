import type { ReactNode } from "react";
import { requireProvider } from "@/contexts/identity/actions";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  await requireProvider();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-e p-4">
        <nav className="flex flex-col gap-2">
          <a href="/provider" className="font-semibold">Overview</a>
          <a href="/provider/schedule">Schedule</a>
          <a href="/provider/services">Services</a>
        </nav>
        <div className="mt-8"><LocaleSwitcher /></div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}