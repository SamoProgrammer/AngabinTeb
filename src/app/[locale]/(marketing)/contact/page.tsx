import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-6 text-gray-700">{t("body")}</p>
    </main>
  );
}