import { getTranslations } from "next-intl/server";
import { Atom, Banknote, Lock, User, Utensils, type LucideIcon } from "lucide-react";

const PILLAR_ICONS: LucideIcon[] = [Atom, Utensils, Banknote, Lock];

interface Pillar {
  title: string;
  description: string;
}

interface BoardMember {
  name: string;
  title: string;
  role: string;
}

export default async function AboutUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("about");
  const pillars = t.raw("pillars") as Pillar[];
  const board = t.raw("board") as BoardMember[];
  const isRtl = locale !== "en";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-16">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-sm sm:text-lg text-on-surface-variant leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </section>

        {/* Core Pillars */}
        <section aria-label={t("pillarsAria")} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-3 text-start"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {(() => {
                  const PillarIcon = PILLAR_ICONS[idx] ?? Atom;
                  return <PillarIcon size={26} aria-hidden="true" />;
                })()}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">{p.title}</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </section>

        {/* Clinical Governance & Advisory Board */}
        <section aria-label={t("boardAria")} className="flex flex-col gap-6 text-start">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              {t("boardHeading")}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              {t("boardSubheading")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {board.map((member, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col items-center text-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  <User size={32} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">{member.name}</h3>
                  <p className="text-xs text-primary font-medium mt-0.5">{member.title}</p>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
