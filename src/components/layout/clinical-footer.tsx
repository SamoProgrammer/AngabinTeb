import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface ClinicalFooterProps {
  locale?: string;
}

export function ClinicalFooter({ locale = "fa" }: ClinicalFooterProps) {
  const isEn = locale === "en";
  const isAr = locale === "ar";

  const content = {
    emergency: isEn
      ? "Notice: Angabin Teb is not an emergency dispatch service. In critical situations, call emergency services (115)."
      : isAr
        ? "تنبيه: انگبین طب ليست خدمة طوارئ طبية. في الحالات الحرجة يرجى الاتصال بالطوارئ (115)."
        : "توجه: انگبین طب سامانه اعزام اورژانس پزشکی نیست. در شرایط بحرانی با ۱۱۵ تماس بگیرید.",
    guarantee: isEn
      ? "All medical appointments are booked with zero online fees — pay directly at the clinic."
      : isAr
        ? "جميع المواعيد الطبية تُحجز بدون أي رسوم إلكترونية مع الدفع المباشر في العيادة."
        : "تمامی نوبت‌های پزشکی بدون اخذ کارمزد آنلاین و با پرداخت حضوری در مطب رزرو می‌شوند.",
    brandTitle: isEn ? "Angabin Teb" : "انگبین طب",
    brandSubtitle: isEn
      ? "Clinical Health & Nutrition Platform"
      : isAr
        ? "منصة الصحة والتغذية السريرية"
        : "سامانه سلامت و تغذیه بالینی",
    description: isEn
      ? "Angabin Teb is the comprehensive platform for booking specialist doctors, diagnostic services, smart metabolic analysis, and clinical medical diets in Iran. All appointments are guaranteed at approved rates with in-clinic payment."
      : isAr
        ? "انگبین طب هي المنصة الشاملة لحجز مواعيد الأطباء الاستشاريين، الخدمات التشخيصية، التحليل الأيضي الذكي والأنظمة الغذائية العلاجية في إيران. تُقدم جميع المواعيد بالتعرفة المعتمدة مع الدفع في العيادة."
        : "انگبین طب مرجع جامع نوبت‌دهی پزشکان متخصص، خدمات پاراکلینیک، آنالیز هوشمند متابولیسم و رژیم‌های درمانی تخصصی در ایران است. کلیه نوبت‌ها با تضمین تعرفه مصوب و پرداخت در مطب ارائه می‌گردد.",
    councilBadge: isEn
      ? "Member of Medical Council"
      : isAr
        ? "عضو منظمة النظام الطبي"
        : "عضو سازمان نظام پزشکی کشور",
    securityBadge: isEn
      ? "Electronic Health Record Security"
      : isAr
        ? "أمان السجل الصحي الإلكتروني"
        : "امنیت پرونده سلامت الکترونیک",
    col1Title: isEn ? "Quick Access" : isAr ? "وصول سريع" : "دسترسی سریع",
    col1Links: isEn
      ? [
          { label: "Doctors Booking", href: `/${locale}/doctors` },
          { label: "Clinical & Diagnostic Services", href: `/${locale}/services` },
          { label: "Body Analysis & BMR", href: `/${locale}/nutrition/body` },
          { label: "Food Diary & Diet", href: `/${locale}/nutrition/diary` },
          { label: "My Appointments", href: `/${locale}/appointments` },
        ]
      : isAr
        ? [
            { label: "حجز الأطباء", href: `/${locale}/doctors` },
            { label: "الخدمات السريرية والتشخيصية", href: `/${locale}/services` },
            { label: "تحليل الجسم وBMR", href: `/${locale}/nutrition/body` },
            { label: "سجل الوجبات والحمية", href: `/${locale}/nutrition/diary` },
            { label: "مواعيدي", href: `/${locale}/appointments` },
          ]
        : [
            { label: "نوبت‌دهی پزشکان", href: `/${locale}/doctors` },
            { label: "خدمات درمانی و پاراکلینیک", href: `/${locale}/services` },
            { label: "آنالیز بدن و BMR", href: `/${locale}/nutrition/body` },
            { label: "یادداشت غذایی و رژیم", href: `/${locale}/nutrition/diary` },
            { label: "پیگیری نوبت‌های من", href: `/${locale}/appointments` },
          ],
    col2Title: isEn ? "Clinical Services" : isAr ? "الخدمات السريرية" : "خدمات بالینی",
    col2Links: isEn
      ? [
          { label: "Laboratory & Health Checkup", href: `/${locale}/services` },
          { label: "Ultrasound & Imaging", href: `/${locale}/services` },
          { label: "Specialist Physician Visits", href: `/${locale}/doctors` },
          { label: "Nutrition & Metabolism Clinic", href: `/${locale}/nutrition` },
          { label: "Therapeutic Diet Protocols", href: `/${locale}/nutrition/diet` },
        ]
      : isAr
        ? [
            { label: "المختبر والفحص الشامل", href: `/${locale}/services` },
            { label: "الموجات فوق الصوتية والتصوير", href: `/${locale}/services` },
            { label: "استشارات الأطباء الاستشاريين", href: `/${locale}/doctors` },
            { label: "عيادة التغذية والأيض", href: `/${locale}/nutrition` },
            { label: "برامج الحمية العلاجية", href: `/${locale}/nutrition/diet` },
          ]
        : [
            { label: "آزمایشگاه و چکاپ سلامت", href: `/${locale}/services` },
            { label: "تصویربرداری و سونوگرافی", href: `/${locale}/services` },
            { label: "ویزیت پزشکان متخصص", href: `/${locale}/doctors` },
            { label: "کلینیک تغذیه و متابولیسم", href: `/${locale}/nutrition` },
            { label: "برنامه‌های غذایی درمانی", href: `/${locale}/nutrition/diet` },
          ],
    col3Title: isEn ? "Knowledge Hub" : isAr ? "قاعدة المعرفة" : "پایگاه دانش و مقالات",
    col3Links: isEn
      ? [
          { label: "Scientific & Clinical Articles", href: `/${locale}/articles` },
          { label: "Health Educational Videos", href: `/${locale}/videos` },
          { label: "Frequently Asked Questions", href: `/${locale}/faq` },
          { label: "Specialized Medical Diets", href: `/${locale}/nutrition/diet` },
          { label: "Food Nutrition Database", href: `/${locale}/foods` },
        ]
      : isAr
        ? [
            { label: "المقالات الطبية والسريرية", href: `/${locale}/articles` },
            { label: "الفيديوهات التعليمية الصحية", href: `/${locale}/videos` },
            { label: "الأسئلة الشائعة (FAQ)", href: `/${locale}/faq` },
            { label: "الأنظمة الغذائية التخصصية", href: `/${locale}/nutrition/diet` },
            { label: "قاعدة بيانات الأغذية", href: `/${locale}/foods` },
          ]
        : [
            { label: "مقالات علمی و بالینی", href: `/${locale}/articles` },
            { label: "ویدیوهای آموزشی سلامت", href: `/${locale}/videos` },
            { label: "پرسش‌های متداول (FAQ)", href: `/${locale}/faq` },
            { label: "رژیم‌های درمانی تخصصی", href: `/${locale}/nutrition/diet` },
            { label: "پایگاه داده تغذیه ایرانی", href: `/${locale}/foods` },
          ],
    col4Title: isEn ? "Accreditation & Trust" : isAr ? "الاعتمادات والموثوقية" : "مجوزها و اعتبارسنجی",
    col4Links: isEn
      ? [
          { label: "About Angabin Teb", href: `/${locale}/about` },
          { label: "Contact Clinical Support", href: `/${locale}/contact` },
          { label: "In-Clinic Payment Guide", href: `/${locale}/faq` },
          { label: "Patient Privacy & Terms", href: `/${locale}/about` },
          { label: "Feedback & Care Rights", href: `/${locale}/support` },
        ]
      : isAr
        ? [
            { label: "عن انگبین طب", href: `/${locale}/about` },
            { label: "التواصل مع الدعم الطبي", href: `/${locale}/contact` },
            { label: "دليل الدفع في العيادة", href: `/${locale}/faq` },
            { label: "الخصوصية وشروط المرضى", href: `/${locale}/about` },
            { label: "الشكاوى ورضا المرضى", href: `/${locale}/support` },
          ]
        : [
            { label: "درباره انگبین طب", href: `/${locale}/about` },
            { label: "ارتباط با پشتیبانی پزشکی", href: `/${locale}/contact` },
            { label: "راهنمای پرداخت حضوری در مطب", href: `/${locale}/faq` },
            { label: "قوانین و حریم خصوصی بیماران", href: `/${locale}/about` },
            { label: "شکایات و بازخورد درمان", href: `/${locale}/support` },
          ],
    copyright: isEn
      ? `© ${new Date().getFullYear()} All rights reserved for Angabin Teb. Designed according to clinical healthcare standards.`
      : isAr
        ? `© ${new Date().getFullYear()} جميع الحقوق محفوظة لمنصة انگبین طب. مصممة وفقاً للمعايير الصحية السريرية.`
        : `© ${new Date().getFullYear()} تمامی حقوق این سامانه متعلق به انگبین طب است. طراحی شده مطابق استانداردهای سلامت بالینی.`,
    emergencyContact: isEn
      ? "National Emergency: 115"
      : isAr
        ? "رقم الطوارئ الوطني: 115"
        : "شماره تماس اورژانس کشور: ۱۱۵",
    supportContact: isEn
      ? "Platform Support: +98-21-88224000"
      : isAr
        ? "دعم المنصة: 021-88224000"
        : "پشتیبانی سامانه: ۰۲۱-۸۸۲۲۴۰۰۰",
  };

  return (
    <footer
      dir={isEn ? "ltr" : "rtl"}
      className="w-full bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface pb-16 md:pb-0"
    >
      {/* Emergency disclaimer banner */}
      <div className="bg-error-container/40 border-b border-error/20 px-4 py-3 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs md:text-sm font-semibold text-error">
          <ClinicalIcon name="emergency" size={20} fill className="text-error shrink-0" />
          <span>{content.emergency}</span>
        </div>
      </div>

      {/* Booking transparency banner */}
      <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs md:text-sm font-medium text-primary">
          <ClinicalIcon name="verified_user" size={18} fill className="text-primary shrink-0" />
          <span>{content.guarantee}</span>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-tier-1">
                <ClinicalIcon name="local_hospital" size={24} fill />
              </div>
              <div className="flex flex-col text-start">
                <span className="text-lg font-bold text-on-surface leading-tight">
                  {content.brandTitle}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {content.brandSubtitle}
                </span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-md text-start">
              {content.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
                <ClinicalIcon name="verified" size={16} className="text-primary" />
                <span>{content.councilBadge}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
                <ClinicalIcon name="health_and_safety" size={16} className="text-primary" />
                <span>{content.securityBadge}</span>
              </div>
            </div>
          </div>

          {/* 4-column clinical link sitemap */}
          {/* Column 1 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="near_me" size={16} className="text-primary" />
              {content.col1Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col1Links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="stethoscope" size={16} className="text-primary" />
              {content.col2Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col2Links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="menu_book" size={16} className="text-primary" />
              {content.col3Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col3Links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="verified" size={16} className="text-primary" />
              {content.col4Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col4Links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar: Trust badges & copyright */}
        <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-4 text-center md:text-start">
            <p>{content.copyright}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span>{content.emergencyContact}</span>
            <span className="text-outline-variant">|</span>
            <span>{content.supportContact}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
