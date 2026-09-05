import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoctor, listProviderServices } from "@/contexts/catalog/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const dbDoctor = await getDoctor(slug, locale).catch(() => null);
  if (!dbDoctor) notFound();

  const bookable = await listProviderServices(dbDoctor.id, locale).catch(() => []);
  const bookHref = bookable[0]
    ? `/${locale}/services/${bookable[0].id}/book`
    : `/${locale}/services`;

  const doctor = {
    id: dbDoctor.id,
    name: dbDoctor.name,
    specialtyName: dbDoctor.specialtyName ?? "متخصص بالینی",
    credentials: dbDoctor.credentials,
    bio: dbDoctor.bio,
    imageUrl: dbDoctor.imageUrl,
    addressLine: dbDoctor.addressLine,
    phone: dbDoctor.phone,
    latitude: dbDoctor.latitude,
    longitude: dbDoctor.longitude,
  };

  const mapUrl =
    doctor.latitude && doctor.longitude
      ? `https://www.openstreetmap.org/?mlat=${doctor.latitude}&mlon=${doctor.longitude}#map=16/${doctor.latitude}/${doctor.longitude}`
      : null;
  return (
    <main className="w-full bg-surface" dir="rtl">
      {/* Breadcrumb & Status Ambient Bar */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              خانه
            </Link>
            <span className="opacity-40">/</span>
            <Link href={`/${locale}/doctors`} className="hover:text-primary transition-colors">
              پزشکان
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-bold truncate max-w-[200px] sm:max-w-none">
              {doctor.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <ClinicalIcon name="check_circle" size={14} className="text-primary" />
            پذیرش نوبت حضوری
          </span>
        </div>
      </div>

      {/* Hero Profile Master Section */}
      <section className="relative w-full bg-surface-container-lowest shadow-tier-1 py-8 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {doctor.imageUrl ? (
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-sm border-2 border-primary/20 shrink-0">
                <img
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border-2 border-primary/20">
                <ClinicalIcon name="stethoscope" size={56} />
              </div>
            )}
            <div className="flex flex-col text-center sm:text-start gap-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {doctor.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
                  <ClinicalIcon name="verified" size={16} fill className="text-primary" />
                  پزشک معتمد
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-primary">
                {doctor.specialtyName}
              </p>
              {doctor.credentials && (
                <p className="text-xs text-on-surface-variant font-medium">
                  {doctor.credentials}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2 w-full sm:w-auto">
            <Link
              href={bookHref}
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <ClinicalIcon name="calendar_month" size={20} />
              <span>رزرو نوبت حضوری</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Body Content: Review Details + Sticky Booking Card */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Details & Biography Column (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Philosophy & Bio Section */}
          {doctor.bio && (
            <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
                <ClinicalIcon name="badge" size={22} />
                <h2>سوابق علمی و رویکرد بالینی</h2>
              </div>
              <p className="text-sm text-on-surface leading-relaxed text-justify">
                {doctor.bio}
              </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                <ClinicalIcon name="school" size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">مدارک و فلوشیپ‌ها</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">{doctor.credentials}</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                <ClinicalIcon name="verified_user" size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">پروانه طبابت معتبر</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">
                    تاییدشده توسط سازمان نظام پزشکی کل کشور
                  </span>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Practice Locations & Map Section */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
            <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <ClinicalIcon name="location_on" size={22} className="text-secondary" />
              <span>نشانی مطب و نوبت‌دهی</span>
            </h3>

            <div className="flex flex-col gap-1 pb-3 border-b border-outline-variant/20">
              {doctor.addressLine && (
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                  {doctor.addressLine}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-primary pt-2">
                {doctor.phone ? (
                  <span className="flex items-center gap-1">
                    <ClinicalIcon name="call" size={16} />
                    <span>{doctor.phone}</span>
                  </span>
                ) : (
                  <span />
                )}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>مسیریابی روی نقشه</span>
                    <ClinicalIcon name="arrow_back" size={14} />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Doctor Booking Sidebar & Tariffs (4 Cols) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
          {/* Booking Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-2 border-2 border-primary/20 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-base font-bold text-on-surface">رزرو حضوری نوبت</span>
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
                پرداخت در مطب
              </span>
            </div>

            {/* Bookable Service */}
            {bookable[0] ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface">خدمت قابل رزرو:</label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-primary/30">
                  <span className="text-xs font-bold text-on-surface">{bookable[0].name}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                برای این پزشک هنوز خدمت قابل رزروی ثبت نشده است؛ از فهرست خدمات انتخاب نمایید.
              </p>
            )}

            {/* Big Booking Button */}
            <Link
              href={bookHref}
              id="bookAppointmentBtn"
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <ClinicalIcon name="event_available" size={20} />
              <span>ثبت نوبت حضوری</span>
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/80 pt-1">
              <ClinicalIcon name="check" size={16} className="text-primary" />
              <span>بدون کارمزد رزرو</span>
            </div>
          </div>

          {/* Quick FAQ / Preparation Box */}
          <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col gap-2 text-xs text-on-surface-variant">
            <span className="font-bold text-on-surface flex items-center gap-1.5 text-sm">
              <ClinicalIcon name="info" size={18} className="text-primary" />
              نکات ضروری پیش از مراجعه
            </span>
            <ul className="space-y-1.5 pe-4 list-disc leading-relaxed mt-1">
              <li>لطفاً برگه آخرین آزمایش‌های خونی ۶ ماه اخیر را به همراه داشته باشید.</li>
              <li>در صورت مصرف داروهای تنظیم قند یا تیروئید، دوزها را یادداشت فرمایید.</li>
              <li>پذیرش بدون نیاز به پرداخت آنلاین ثبت شده و تسویه در مطب انجام می‌شود.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}