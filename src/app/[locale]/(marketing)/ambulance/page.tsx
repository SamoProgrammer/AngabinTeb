import { useTranslations } from "next-intl";

export default function AmbulancePage() {
  const t = useTranslations("ambulance");
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-6 text-gray-700">{t("body")}</p>
      <a
        href="/services?serviceType=ambulance"
        className="mt-8 inline-block rounded bg-blue-600 px-4 py-2 text-white"
      >
        {t("book")}
      </a>
    </main>
  );
}