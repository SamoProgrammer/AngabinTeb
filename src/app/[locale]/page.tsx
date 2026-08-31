import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function HomePage() {
  const t = useTranslations();
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <header className="flex items-center justify-between">
        <nav className="flex gap-4">
          <a href="/">{t("nav.home")}</a>
          <a href="/doctors">{t("nav.doctors")}</a>
          <a href="/services">{t("nav.services")}</a>
          <a href="/admin">{t("nav.admin")}</a>
        </nav>
        <LocaleSwitcher />
      </header>
      <h1 className="mt-16 text-5xl font-bold">{t("home.heroTitle")}</h1>
      <p className="mt-4 text-xl text-gray-600">{t("home.heroSubtitle")}</p>
    </main>
  );
}