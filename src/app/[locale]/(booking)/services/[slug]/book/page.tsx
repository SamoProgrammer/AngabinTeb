import { getService } from "@/contexts/catalog/queries";
import { availabilityForService } from "@/contexts/catalog/actions";
import { SlotPicker } from "@/components/booking/slot-picker";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits, formatPrice } from "@/components/catalog/doctor-card";

const SAMPLE_SERVICES: Record<string, {
  name: string;
  providerName: string;
  serviceType: string;
  durationMinutes: number;
  basePrice: number;
  addressLine: string;
}> = {
  "service-metabolic-checkup": {
    name: "چکاپ جامع متابولیک و قند ناشتا",
    providerName: "آزمایشگاه پاتوبیولوژی ونک",
    serviceType: "diagnostic",
    durationMinutes: 30,
    basePrice: 480000,
    addressLine: "تهران، خیابان ملاصدرا، نرسیده به میدان ونک، پلاک ۴۲",
  },
  "svc-ecg-1": {
    name: "اکوکاردیوگرافی داپلر و نوار قلب (ECG)",
    providerName: "مرکز قلب و کلینیک بهار",
    serviceType: "diagnostic",
    durationMinutes: 35,
    basePrice: 620000,
    addressLine: "تهران، میدان آرژانتین، خیابان الوند، مرکز قلب بهار",
  },
};

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale, slug } = await params;
  const { date } = await searchParams;

  let dbService = null;
  try {
    dbService = await getService(slug, locale);
  } catch {
    dbService = null;
  }

  const sample = SAMPLE_SERVICES[slug] ?? SAMPLE_SERVICES["service-metabolic-checkup"];

  const service = {
    id: dbService?.id ?? slug,
    name: dbService?.name ?? sample.name,
    providerName: dbService?.providerName ?? sample.providerName,
    serviceType: dbService?.serviceType ?? sample.serviceType,
    durationMinutes: dbService?.durationMinutes ?? sample.durationMinutes,
    basePrice: dbService?.basePrice ? Number(dbService.basePrice) : sample.basePrice,
    addressLine: dbService?.addressLine ?? sample.addressLine,
  };

  const day = date ?? new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  let slots: Array<{
    id: string;
    startsAt: Date;
    capacity: number;
    bookedCount: number;
  }> = [];

  try {
    const rawSlots = await availabilityForService(service.id, day);
    slots = rawSlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      capacity: s.capacity,
      bookedCount: s.bookedCount,
    }));
  } catch {
    slots = [];
  }

  return (
    <main className="w-full bg-surface py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Service & Provider Summary Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-between">
          <div className="flex items-center gap-4 text-right">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ClinicalIcon name="local_hospital" size={32} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-bold text-on-surface">
                  {service.name}
                </h1>
                <ClinicalIcon name="verified" size={18} fill className="text-primary shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {service.providerName} • زمان تقریبی {toPersianDigits(service.durationMinutes)} دقیقه
              </p>
              <span className="text-xs text-outline mt-1">{service.addressLine}</span>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
            <span className="text-xs text-on-surface-variant">حق ویزیت / تعرفه در مطب:</span>
            <span className="text-base sm:text-lg font-bold text-primary">
              {formatPrice(service.basePrice)}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium mt-1">
              پرداخت در محل مطب
            </span>
          </div>
        </div>

        {/* Step Indicator Simple */}
        <div className="flex items-center justify-between px-2 text-xs sm:text-sm font-medium text-on-surface-variant">
          <span className="text-primary font-bold flex items-center gap-1">
            <ClinicalIcon name="calendar_month" size={16} />
            <span>۱. انتخاب روز و ساعت</span>
          </span>
          <span className="opacity-40">—</span>
          <span className="flex items-center gap-1">
            <ClinicalIcon name="person" size={16} />
            <span>۲. اطلاعات بیمار</span>
          </span>
          <span className="opacity-40">—</span>
          <span className="flex items-center gap-1">
            <ClinicalIcon name="check_circle" size={16} />
            <span>۳. تایید نهایی</span>
          </span>
        </div>

        {/* Calendar & Date Selection Form */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              <ClinicalIcon name="calendar_today" size={18} className="text-primary" />
              <span>انتخاب تاریخ نوبت</span>
            </h2>
            <span className="text-xs text-on-surface-variant">
              تاریخ انتخابی: {toPersianDigits(day)}
            </span>
          </div>

          <form action={`/${locale}/services/${slug}/book`} method="GET" className="flex flex-col sm:flex-row items-center gap-3">
            <label htmlFor="date" className="text-xs text-on-surface font-medium shrink-0">
              تغییر تاریخ مراجعه:
            </label>
            <input
              id="date"
              type="date"
              name="date"
              defaultValue={day}
              className="bg-surface-container-low text-xs sm:text-sm text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium rounded-xl transition-colors"
            >
              نمایش نوبت‌ها
            </button>
          </form>
        </div>

        {/* Modernized Slot Picker */}
        <SlotPicker
          slots={slots.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            capacity: s.capacity,
            bookedCount: s.bookedCount,
          }))}
          serviceId={service.id}
          locale={locale}
          price={service.basePrice}
        />
      </div>
    </main>
  );
}