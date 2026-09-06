import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface MetricItem {
  value: string;
  label: string;
  subtext: string;
  colorClass?: string;
}

export interface TrustPillar {
  icon: string;
  title: string;
  description: string;
  iconColorClass?: string;
}

export interface TrustMetricsProps {
  className?: string;
  metrics?: MetricItem[];
  pillars?: TrustPillar[];
}

const DEFAULT_METRICS: MetricItem[] = [
  {
    value: "بیش از ۵۰",
    label: "پزشک متخصص",
    subtext: "دارای پروانه معتبر نظام پزشکی",
    colorClass: "text-primary",
  },
  {
    value: "۱۰۰٪",
    label: "پرداخت مستقیم در مطب",
    subtext: "بدون هرگونه کارمزد آنلاین",
    colorClass: "text-secondary",
  },
  {
    value: "۲۴ ساعته",
    label: "پشتیبانی روزانه بیماران",
    subtext: "پاسخگویی به سوالات و راهنمایی مراجعان",
    colorClass: "text-primary",
  },
];

const DEFAULT_PILLARS: TrustPillar[] = [
  {
    icon: "shield",
    title: "حفاظت از پرونده بالینی",
    description:
      "تمامی اطلاعات آزمایش‌ها، نوبت‌ها و داده‌های غذایی کاربران در محیطی امن و محرمانه نگهداری می‌شود.",
    iconColorClass: "text-primary",
  },
  {
    icon: "price_check",
    title: "تعرفه مصوب وزارت بهداشت",
    description:
      "هزینه کلیه ویزیت‌ها و خدمات درمانی مطابق تعرفه رسمی دریافت شده و هیچ کارمزد آنلاینی اخذ نمی‌شود.",
    iconColorClass: "text-secondary",
  },
  {
    icon: "support_agent",
    title: "پشتیبانی اختصاصی بیمار",
    description:
      "پاسخگویی به سوالات مربوط به نوبت‌دهی، راهنمایی شرایط مراجعه و پیگیری درخواست‌های مراجعان.",
    iconColorClass: "text-primary",
  },
];

export function TrustMetrics({
  className = "",
  metrics = DEFAULT_METRICS,
  pillars = DEFAULT_PILLARS,
}: TrustMetricsProps) {
  return (
    <section className={`w-full ${className}`} dir="rtl" aria-label="شاخص‌های اعتماد و شفافیت بالینی">
      <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30">
        {/* Clinical Counter Badges */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-8`}>
          {metrics.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-tier-1 border border-outline-variant/20 hover:shadow-tier-2 transition-all flex flex-col items-center justify-center"
            >
              <span className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight block ${item.colorClass ?? "text-primary"}`}>
                {item.value}
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface block mt-1.5">
                {item.label}
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant mt-1 leading-snug">
                {item.subtext}
              </span>
            </div>
          ))}
        </div>

        {/* 3 Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/20 hover:shadow-tier-2 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                <ClinicalIcon
                  name={pillar.icon}
                  size={28}
                  className={pillar.iconColorClass ?? "text-primary"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1.5">
                  {pillar.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
