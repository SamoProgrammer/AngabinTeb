import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface ClinicalFooterProps {
  locale?: string;
}

export function ClinicalFooter({ locale = "fa" }: ClinicalFooterProps) {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface">
      {/* Emergency disclaimer banner */}
      <div className="bg-error-container/40 border-b border-error/20 px-4 py-3 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs md:text-sm font-semibold text-error">
          <ClinicalIcon name="emergency" size={20} fill className="text-error shrink-0" />
          <span>توجه: انگبین طب سامانه اعزام اورژانس پزشکی نیست. در شرایط بحرانی با ۱۱۵ تماس بگیرید.</span>
        </div>
      </div>

      {/* Booking transparency banner */}
      <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs md:text-sm font-medium text-primary">
          <ClinicalIcon name="verified_user" size={18} fill className="text-primary shrink-0" />
          <span>تمامی نوبت‌های پزشکی بدون اخذ کارمزد آنلاین و با پرداخت حضوری در مطب رزرو می‌شوند.</span>
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
              <div className="flex flex-col">
                <span className="text-lg font-bold text-on-surface leading-tight">انگبین طب</span>
                <span className="text-xs text-on-surface-variant font-medium">سامانه سلامت و تغذیه بالینی</span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-md">
              انگبین طب مرجع جامع نوبت‌دهی پزشکان متخصص، خدمات پاراکلینیک، آنالیز هوشمند متابولیسم و رژیم‌های درمانی تخصصی در ایران است. کلیه نوبت‌ها با تضمین تعرفه مصوب و پرداخت در مطب ارائه می‌گردد.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
                <ClinicalIcon name="verified" size={16} className="text-primary" />
                <span>عضو سازمان نظام پزشکی کشور</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
                <ClinicalIcon name="health_and_safety" size={16} className="text-primary" />
                <span>امنیت پرونده سلامت الکترونیک</span>
              </div>
            </div>
          </div>

          {/* 4-column clinical link sitemap */}
          {/* Column 1: دسترسی سریع */}
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="near_me" size={16} className="text-primary" />
              دسترسی سریع
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              <li>
                <Link href={`/${locale}/doctors`} className="hover:text-primary transition-colors">
                  نوبت‌دهی پزشکان
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
                  خدمات درمانی و پاراکلینیک
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/nutrition/body`} className="hover:text-primary transition-colors">
                  آنالیز بدن و BMR
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/nutrition/diary`} className="hover:text-primary transition-colors">
                  یادداشت غذایی و رژیم
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/appointments`} className="hover:text-primary transition-colors">
                  پیگیری نوبت‌های من
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: خدمات بالینی */}
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="stethoscope" size={16} className="text-primary" />
              خدمات بالینی
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              <li>
                <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
                  آزمایشگاه و چکاپ سلامت
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
                  تصویربرداری و سونوگرافی
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/doctors`} className="hover:text-primary transition-colors">
                  ویزیت پزشکان متخصص
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/nutrition`} className="hover:text-primary transition-colors">
                  کلینیک تغذیه و متابولیسم
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/nutrition/diet`} className="hover:text-primary transition-colors">
                  برنامه‌های غذایی درمانی
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: پایگاه دانش و مقالات */}
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="menu_book" size={16} className="text-primary" />
              پایگاه دانش و مقالات
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              <li>
                <Link href={`/${locale}/articles`} className="hover:text-primary transition-colors">
                  مقالات علمی و بالینی
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/videos`} className="hover:text-primary transition-colors">
                  ویدیوهای آموزشی سلامت
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="hover:text-primary transition-colors">
                  پرسش‌های متداول (FAQ)
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/nutrition/diet`} className="hover:text-primary transition-colors">
                  رژیم‌های درمانی تخصصی
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/foods`} className="hover:text-primary transition-colors">
                  پایگاه داده تغذیه ایرانی
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: مجوزها و اعتبارسنجی */}
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <ClinicalIcon name="verified" size={16} className="text-primary" />
              مجوزها و اعتبارسنجی
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-primary transition-colors">
                  درباره انگبین طب
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-primary transition-colors">
                  ارتباط با پشتیبانی پزشکی
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="hover:text-primary transition-colors">
                  راهنمای پرداخت حضوری در مطب
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-primary transition-colors">
                  قوانین و حریم خصوصی بیماران
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/support`} className="hover:text-primary transition-colors">
                  شکایات و بازخورد درمان
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar: Trust badges & copyright */}
        <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-4 text-center md:text-start">
            <p>
              © {new Date().getFullYear()} تمامی حقوق این سامانه متعلق به انگبین طب است. طراحی شده مطابق استانداردهای سلامت بالینی.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span>شماره تماس اورژانس کشور: ۱۱۵</span>
            <span className="text-outline-variant">|</span>
            <span>پشتیبانی سامانه: ۰۲۱-۸۸۲۲۴۰۰۰</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
