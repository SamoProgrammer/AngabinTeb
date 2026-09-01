import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("about");
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">About</h1>
      <p className="mt-6 text-gray-700">{t("body")}</p>
    </main>
  );
}