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
    value: "+۱۲۰",
    label: "پزشک متخصص",
    subtext: "دارای پروانه معتبر نظام پزشکی",
    colorClass: "text-primary",
  },
  {
    value: "+۴۵k",
    label: "نوبت موفق",
    subtext: "بدون کنسلی یا اتلاف وقت مراجع",
    colorClass: "text-secondary",
  },
  {
    value: "+۸۰۰",
    label: "بانک اطلاعات غذایی",
    subtext: "با جدول آنالیز درشت‌مغذی‌ها",
    colorClass: "text-primary",
  },
  {
    value: "۱۰۰٪",
    label: "پرداخت در مطب",
    subtext: "بدون هرگونه کارمزد پنهان آنلاین",
    colorClass: "text-secondary",
  },
];

const DEFAULT_PILLARS: TrustPillar[] = [
  {
    icon: "shield",
    title: "حفاظت از پرونده بالینی",
    description:
      "تمامی اطلاعات آزمایش‌ها، نوبت‌ها و داده‌های غذایی کاربران منطبق با بالاترین استانداردهای محرمانگی رمزنگاری می‌شوند.",
    iconColorClass: "text-primary",
  },
  {
    icon: "price_check",
    title: "تعرفه مصوب وزارت بهداشت",
    description:
      "هزینه کلیه ویزیت‌ها و خدمات پاراکلینیک دقیقاً بر اساس تعرفه مصوب وزارت بهداشت و سازمان نظام پزشکی دریافت می‌شود.",
    iconColorClass: "text-secondary",
  },
  {
    icon: "support_agent",
    title: "پشتیبانی اختصاصی بیمار",
    description:
      "تیم پرستاری و پشتیبانی انگبین طب در تمامی مراحل قبل، حین و پس از نوبت در کنار شما پاسخگوی سوالات بالینی است.",
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
        {/* 4 Clinical Counter Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
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
