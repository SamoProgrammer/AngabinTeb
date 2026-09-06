import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/contexts/identity/actions";
import { getProgramContent } from "@/contexts/nutrition/queries";
import { isPricedProgram } from "@/contexts/nutrition/kernel";
import { formatPersianNumber, toPersianDigits } from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function DietDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await requireUser();
  const { locale, id } = await params;
  // Server-side claim gate lives inside getProgramContent: unclaimed callers
  // get downloadUrl: null, so the file can never leak through this page.
  const content = await getProgramContent(id, user.id, locale);
  if (!content) notFound();

  return (
    <div className="flex flex-col gap-6 text-start" dir="rtl">
      <Link
        href=".."
        aria-label="BackToDiet"
        className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <ClinicalIcon name="arrow_forward" size={16} />
        <span>بازگشت به برنامه‌های رژیمی (Back)</span>
      </Link>

      <section
        aria-label="ProgramDetail"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {content.planType || "پروتکل بالینی"}
          </span>
          <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">
            دوره {toPersianDigits(content.durationDays)} روزه
          </span>
          {content.hasClaim && (
            <span
              aria-label="Owned"
              className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1"
            >
              <ClinicalIcon name="verified" size={14} />
              <span>متعلق به شما (Owned)</span>
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
          {content.name}
        </h1>
        {content.description && (
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {content.description}
          </p>
        )}
        {content.practitionerName && (
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <ClinicalIcon name="stethoscope" size={16} className="text-primary" />
            <span>
              پایشگر: {content.practitionerName}
              {content.practitionerPhone && ` • تلفن: ${toPersianDigits(content.practitionerPhone)}`}
            </span>
          </p>
        )}

        {content.accessDenied ? (
          <div
            aria-label="AccessDenied"
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-3"
          >
            <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900">
              <ClinicalIcon name="lock" size={20} />
              <span>دریافت این برنامه نیازمند ثبت درخواست است (Claim required)</span>
            </p>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              تعرفه دوره:{" "}
              <strong className="font-data-metric">
                {formatPersianNumber(Number(content.price))} تومان
              </strong>
              . پس از ثبت درخواست، فایل برنامه برای حساب شما فعال می‌شود و بدون ثبت مجدد در
              دسترس می‌ماند.
            </p>
            <Link
              href={`../?context=${content.organizationContext}&claim=${content.id}`}
              aria-label="Claim"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <ClinicalIcon name="check_circle" size={18} />
              <span>بازبینی و ثبت درخواست (Claim)</span>
            </Link>
          </div>
        ) : (
          <div aria-label="ProgramAccess" className="flex flex-col gap-3">
            {content.downloadUrl ? (
              <a
                href={content.downloadUrl}
                aria-label="Download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all"
              >
                <ClinicalIcon name="download" size={18} />
                <span>دریافت فایل برنامه (Download)</span>
              </a>
            ) : (
              <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-2xl p-4 leading-relaxed">
                فایل قابل دانلود هنوز برای این برنامه پیوست نشده است. محتوای بالای صفحه همان
                چیزی است که این برنامه ارائه می‌دهد؛ به‌محض پیوست فایل، از همین‌جا قابل دریافت
                خواهد بود.
              </p>
            )}
            {!content.hasClaim && !isPricedProgram(content.price) && (
              <Link
                href={`../?context=${content.organizationContext}&claim=${content.id}`}
                aria-label="Claim"
                className="text-xs font-bold text-primary hover:underline self-start"
              >
                ثبت درخواست برای سوابق من (Claim)
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
