import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MetabolismCalculator } from "@/components/clinical/metabolism-calculator";

describe("MetabolismCalculator Component", () => {
  it("renders with default props matching Stitch Screen 13 specifications", () => {
    const html = renderToString(<MetabolismCalculator locale="fa" />);

    // Section and container attributes
    expect(html).toContain('id="metabolism-widget"');
    expect(html).toContain('dir="rtl"');

    // Title and badge
    expect(html).toContain("محاسبه‌گر بالینی سوخت‌وساز پایه");
    expect(html).toContain("سنجش زنده متابولیسم بدنی و انرژی مصرفی");
    expect(html).toContain("معتبرسازی بالینی");
    expect(html).toContain(">calculate</span>");

    // Gender selector
    expect(html).toContain("جنسیت فیزیولوژیک:");
    expect(html).toContain("آقا (مرد)");
    expect(html).toContain("خانم (زن)");
    expect(html).toContain(">male</span>");
    expect(html).toContain(">female</span>");

    // Inputs default values
    expect(html).toContain('value="32"');
    expect(html).toContain('value="175"');
    expect(html).toContain('value="69"');

    // Default calculations (Screen 13 golden metrics)
    // BMR: 1629 in Persian
    expect(html).toContain('id="bmr-output"');
    expect(html).toContain("۱٬۶۲۹");
    expect(html).toContain("کیلوکالری در حالت استراحت مطلق");

    // TDEE: 2240 in Persian
    expect(html).toContain('id="tdee-output"');
    expect(html).toContain("۲٬۲۴۰");
    expect(html).toContain("کیلوکالری کل جهت حفظ وزن");

    // BMI: 22.5 in Persian and label
    expect(html).toContain('id="bmi-output"');
    expect(html).toContain("۲۲٫۵");
    expect(html).toContain('id="bmi-label"');
    expect(html).toContain("محدوده ایده‌آل و طبیعی");

    // CTA Link to Iranian food diary
    expect(html).toContain('href="/fa/nutrition/diary"');
    expect(html).toContain(">restaurant</span>");
    expect(html).toContain("ورود به دفترچه تغذیه با سفره ایرانی (کفگیر، پیاله، پرس)");
  });

  it("correctly renders female calculations with custom initial parameters", () => {
    const html = renderToString(
      <MetabolismCalculator
        locale="fa"
        initialGender="female"
        initialAge={25}
        initialHeight={160}
        initialWeight={55}
        initialActivity={1.55}
      />
    );

    // BMR: 10 * 55 + 6.25 * 160 - 5 * 25 - 161 = 1264 -> ۱٬۲۶۴
    expect(html).toContain("۱٬۲۶۴");

    // TDEE: 1264 * 1.55 = 1959.2 -> 1959 -> ۱٬۹۵۹
    expect(html).toContain("۱٬۹۵۹");

    // BMI: 55 / (1.6 * 1.6) = 21.48 -> 21.5 -> ۲۱٫۵
    expect(html).toContain("۲۱٫۵");
    expect(html).toContain("محدوده ایده‌آل و طبیعی");
  });

  it("displays clinical obesity label for high BMI input", () => {
    const html = renderToString(
      <MetabolismCalculator
        locale="fa"
        initialGender="male"
        initialAge={35}
        initialHeight={175}
        initialWeight={105}
        initialActivity={1.2}
      />
    );

    // BMI: 105 / (1.75 * 1.75) = 34.28 -> 34.3 -> ۳۴٫۳
    expect(html).toContain("۳۴٫۳");
    expect(html).toContain("محدوده چاقی بالینی");
  });

  it("displays underweight label for low BMI input", () => {
    const html = renderToString(
      <MetabolismCalculator
        locale="fa"
        initialGender="female"
        initialAge={22}
        initialHeight={170}
        initialWeight={45}
        initialActivity={1.2}
      />
    );

    // BMI: 45 / (1.7 * 1.7) = 15.57 -> 15.6 -> ۱۵٫۶
    expect(html).toContain("۱۵٫۶");
    expect(html).toContain("کمبود وزن (لاغری)");
  });

  it("supports custom diaryHref and non-default locale", () => {
    const customHrefHtml = renderToString(
      <MetabolismCalculator
        locale="en"
        diaryHref="/custom/food-tracker"
      />
    );
    expect(customHrefHtml).toContain('href="/custom/food-tracker"');

    const localeHrefHtml = renderToString(
      <MetabolismCalculator
        locale="ar"
      />
    );
    expect(localeHrefHtml).toContain('href="/ar/nutrition/diary"');
  });
});
