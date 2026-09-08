import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { User } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import PersonalInfoForm from "./personal-info-form";

export default async function ProfilePersonalInfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("account.personalInfo");
  const dir = locale === "en" ? "ltr" : "rtl";

  // Server-side session re-verification (layout also gates, defense in depth).
  const sessionUser = await requireUser();
  const [row] = await db.select().from(users).where(eq(users.id, sessionUser.id));

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">{t("breadcrumb")}</span>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-2 border border-outline-variant/30 text-start">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-outline-variant/20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xl">
              <User size={36} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-on-surface">
                {t("title")}
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("subtitle")}
              </p>
            </div>
          </div>

          <PersonalInfoForm
            initial={{
              name: row?.name ?? "",
              nationalId: row?.nationalId ?? "",
              fatherName: row?.fatherName ?? "",
              gender: row?.gender ?? "male",
            }}
            phone={row?.phoneNumber ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
