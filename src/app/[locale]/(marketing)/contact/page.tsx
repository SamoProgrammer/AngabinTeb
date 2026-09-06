import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default function ContactPage() {
  const contactMethods = [
    {
      icon: "call",
      title: "مرکز تماس و پذیرش تلفنی",
      value: "۰۲۱-۸۸۸۸۴۵۶۷",
      note: "پاسخگویی شنبه تا پنجشنبه از ساعت ۸ الی ۲۰",
    },
    {
      icon: "support_agent",
      title: "پشتیبانی آنلاین و پیام‌رسان",
      value: "۰۹۱۲۳۴۵۶۷۸۹",
      note: "پاسخگویی به پیام‌ها در تمام ساعات شبانه‌روز",
    },
    {
      icon: "mail",
      title: "پست الکترونیک رسمی",
      value: "info@angabinteb.ir",
      note: "مکاتبات اداری، همکاری پزشکان و روابط عمومی",
    },
  ];

  const clinics = [
    {
      name: "کلینیک مرکزی انگبین طب (شعبه ولیعصر)",
      address: "تهران، خیابان ولیعصر، بالاتر از میدان ونک، کوچه نگار، پلاک ۲۴",
      phone: "۰۲۱-۸۸۸۸۴۵۶۷",
      hours: "۸:۰۰ الی ۲۱:۰۰",
    },
    {
      name: "مرکز غرب و پایش متابولیک (شعبه سعادت‌آباد)",
      address: "تهران، سعادت‌آباد، میدان کاج، بلوار سرو غربی، مجتمع پزشکی سرو",
      phone: "۰۲۱-۲۲۱۱۵۶۷۸",
      hours: "۹:۰۰ الی ۱۹:۰۰",
    },
  ];

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {/* Header Hero */}
        <section className="text-center flex flex-col items-center gap-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            تماس با کلینیک‌ها و پشتیبانی انگبین طب
          </h1>
          <p className="text-sm sm:text-lg text-on-surface-variant leading-relaxed">
            جهت مشاوره با پذیرش، هماهنگی نوبت ویزیت یا ارسال نظرات، از روش‌های زیر با ما در ارتباط باشید.
          </p>
        </section>

        {/* Contact Methods Cards */}
        <section aria-label="راه‌های ارتباطی سریع" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((c, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ClinicalIcon name={c.icon} size={24} />
              </div>
              <h2 className="font-bold text-base text-on-surface">{c.title}</h2>
              <span className="text-lg font-extrabold text-primary dir-ltr tracking-wider">
                {c.value}
              </span>
              <p className="text-xs text-on-surface-variant">{c.note}</p>
            </div>
          ))}
        </section>

        {/* Clinics Physical Addresses (Screen #33) */}
        <section aria-label="شعب و مراکز پزشکی" className="flex flex-col gap-6 text-start">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              مراکز درمانی و مطب‌های طرف قرارداد
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              موقعیت جغرافیایی و شماره تماس کلینیک‌های مجهز به آزمایشگاه و چکاپ بالینی
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinics.map((clinic, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <ClinicalIcon name="domain" size={20} />
                    <h3 className="font-bold text-base text-on-surface">{clinic.name}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {clinic.address}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/10 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <ClinicalIcon name="phone" size={16} className="text-primary" />
                    <span className="dir-ltr font-bold text-on-surface">{clinic.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ClinicalIcon name="schedule" size={16} className="text-primary" />
                    <span>ساعات کاری: {clinic.hours}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}