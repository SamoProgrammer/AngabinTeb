import type { ReactNode } from "react";
import { getSettings } from "@/contexts/platform/queries";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const socialUrl = settings.social?.url;
  const enamadUrl = settings.enamad?.url;
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
          <nav className="flex gap-4">
            {socialUrl && <a href={socialUrl}>Social</a>}
            {enamadUrl && <a href={enamadUrl}>eNAMAD seal</a>}
          </nav>
          <LocaleSwitcher />
        </div>
      </footer>
    </div>
  );
}