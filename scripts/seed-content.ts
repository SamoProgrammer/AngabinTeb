import "dotenv/config";
import { db } from "../src/db";
import {
  contents,
  topics,
  conditions,
  contentTopics,
  translations,
  settings,
} from "../src/db/schema";

// Ruling 3: topic slugs/names pinned (J-005 e2e hardcodes /fa/topics/diabetes).
const TOPICS: Array<{ id: string; slug: string; name: string }> = [
  { id: "topic-life-stages", slug: "life-stages", name: "مراحل زندگی" },
  { id: "topic-fitness", slug: "fitness", name: "تناسب اندام" },
  { id: "topic-gi-disease", slug: "gi-disease", name: "بیماریهای گوارشی" },
  { id: "topic-diabetes", slug: "diabetes", name: "دیابت" },
  { id: "topic-pulmonary", slug: "pulmonary", name: "بیماریهای ریوی" },
  { id: "topic-rheumatology", slug: "rheumatology", name: "روماتولوژی" },
  { id: "topic-thyroid", slug: "thyroid", name: "تیروئید" },
  { id: "topic-anemia", slug: "anemia", name: "کمخونی" },
  { id: "topic-cancer", slug: "cancer", name: "سرطان" },
  { id: "topic-neuropsychiatric", slug: "neuropsychiatric", name: "اعصاب و روان" },
  { id: "topic-cardiovascular", slug: "cardiovascular", name: "قلب و عروق" },
];

// Ruling 5: one published article + one FAQ per topic; no title matches /ECG|نوار قلب/.
const CONTENT: Array<{
  id: string; topicSlug: string; kind: string; title: string; body: string;
}> = [
  { id: "content-life-stages-1", topicSlug: "life-stages", kind: "article", title: "مراحل زندگی: مراقبت‌های سلامت در هر دوره", body: "سلامت در هر دوره از زندگی نیازهای متفاوتی دارد؛ از واکسیناسیون دوران کودکی تا غربالگری‌های دوره سالمندی." },
  { id: "content-faq-life-stages-1", topicSlug: "life-stages", kind: "faq", title: "در چه سنی باید معاینات دوره‌ای شروع شود؟", body: "معاینات پایه از نوجوانی توصیه می‌شود و از ۴۰ سالگی با غربالگری‌های سالانه ادامه می‌یابد." },
  { id: "content-fitness-1", topicSlug: "fitness", kind: "article", title: "تناسب اندام: اصول شروع فعالیت بدنی", body: "شروع تدریجی ورزش هوازی و مقاومتی، همراه با تغذیه متعادل، پایه حفظ تناسب اندام است." },
  { id: "content-faq-fitness-1", topicSlug: "fitness", kind: "faq", title: "چند روز در هفته ورزش کنیم؟", body: "بزرگسالان حداقل ۱۵۰ دقیقه فعالیت هوازی متوسط در هفته و دو جلسه تمرین مقاومتی نیاز دارند." },
  { id: "content-gi-disease-1", topicSlug: "gi-disease", kind: "article", title: "بیماری‌های گوارشی چیست؟", body: "بیماری‌های گوارشی طیف گسترده‌ای از رفلاکس معده تا بیماری‌های التهابی روده را شامل می‌شود." },
  { id: "content-faq-gi-disease-1", topicSlug: "gi-disease", kind: "faq", title: "چه زمانی برای درد معده به پزشک مراجعه کنیم؟", body: "درد شدید، خونریزی گوارشی یا کاهش وزن بی‌دلیل نیاز به بررسی فوری پزشکی دارد." },
  { id: "content-diabetes-1", topicSlug: "diabetes", kind: "article", title: "دیابت چیست؟", body: "دیابت بیماری مزمنی است که در آن قند خون به دلیل ناتوانی در تولید یا استفاده از انسولین بالا می‌ماند." },
  { id: "content-faq-diabetes-1", topicSlug: "diabetes", kind: "faq", title: "آیا دیابت قابل درمان است؟", body: "دیابت درمان قطعی ندارد اما با دارو، رژیم غذایی و فعالیت بدنی کاملاً قابل کنترل است." },
  { id: "content-pulmonary-1", topicSlug: "pulmonary", kind: "article", title: "بیماری‌های ریوی و راه‌های پیشگیری", body: "آسم، بیماری انسدادی مزمن ریه و عفونت‌های تنفسی با پرهیز از دخانیات و آلودگی قابل پیشگیری هستند." },
  { id: "content-faq-pulmonary-1", topicSlug: "pulmonary", kind: "faq", title: "آیا سرماخوردگی مکرر نشانه بیماری ریوی است؟", body: "سرماخوردگی مکرر لزوماً نشانه بیماری ریوی نیست، اما تنگی نفس مداوم باید بررسی شود." },
  { id: "content-rheumatology-1", topicSlug: "rheumatology", kind: "article", title: "روماتولوژی: آشنایی با بیماری‌های مفصلی", body: "بیماری‌های روماتیسمی شامل آرتریت‌ها و بیماری‌های خودایمنی هستند که مفاصل و بافت‌های همبند را درگیر می‌کنند." },
  { id: "content-faq-rheumatology-1", topicSlug: "rheumatology", kind: "faq", title: "آیا درد صبحگاهی مفاصل طبیعی است؟", body: "سفتی صبحگاهی بیش از ۳۰ دقیقه می‌تواند نشانه بیماری التهابی مفاصل باشد و نیاز به بررسی دارد." },
  { id: "content-thyroid-1", topicSlug: "thyroid", kind: "article", title: "تیروئید: علائم پرکاری و کم‌کاری", body: "اختلالات تیروئید با آزمایش خون قابل تشخیص است؛ پرکاری و کم‌کاری هر دو با دارو قابل درمان هستند." },
  { id: "content-faq-thyroid-1", topicSlug: "thyroid", kind: "faq", title: "کم‌کاری تیروئید چه علائمی دارد؟", body: "خستگی، افزایش وزن، سردی اندام‌ها و ریزش مو از علائم شایع کم‌کاری تیروئید هستند." },
  { id: "content-anemia-1", topicSlug: "anemia", kind: "article", title: "کم‌خونی: علائم، علل و درمان", body: "کم‌خونی فقر آهن شایع‌ترین نوع کم‌خونی است و با اصلاح رژیم غذایی و مکمل آهن قابل درمان است." },
  { id: "content-faq-anemia-1", topicSlug: "anemia", kind: "faq", title: "خستگی مفرط همیشه نشانه کم‌خونی است؟", body: "خیر؛ کم‌خونی تنها یکی از علل خستگی است و تشخیص با آزمایش خون کامل (CBC) انجام می‌شود." },
  { id: "content-cancer-1", topicSlug: "cancer", kind: "article", title: "سرطان: آگاهی، پیشگیری و غربالگری", body: "ترک سیگار، فعالیت بدنی و غربالگری‌های دوره‌ای مانند ماموگرافی و کولونوسکوپی بار سرطان را کاهش می‌دهد." },
  { id: "content-faq-cancer-1", topicSlug: "cancer", kind: "faq", title: "آیا سرطان قابل پیشگیری است؟", body: "حدود یک‌سوم سرطان‌ها با سبک زندگی سالم و پرهیز از عوامل خطر قابل پیشگیری هستند." },
  { id: "content-neuropsychiatric-1", topicSlug: "neuropsychiatric", kind: "article", title: "اعصاب و روان: حفظ سلامت روان", body: "خواب کافی، ورزش منظم و گفت‌وگو درباره هیجانات از ارکان اصلی حفظ سلامت روان هستند." },
  { id: "content-faq-neuropsychiatric-1", topicSlug: "neuropsychiatric", kind: "faq", title: "اضطراب روزمره چه زمانی نیاز به درمان دارد؟", body: "زمانی که اضطراب در کار، خواب یا روابط اختلال ایجاد کند، مراجعه به روان‌پزشک توصیه می‌شود." },
  { id: "content-cardiovascular-1", topicSlug: "cardiovascular", kind: "article", title: "قلب و عروق: پیشگیری از بیماری‌های قلبی", body: "کنترل فشار خون و چربی خون، تغذیه سالم و تحرک بدنی مهم‌ترین راه‌های پیشگیری از بیماری قلبی هستند." },
  { id: "content-faq-cardiovascular-1", topicSlug: "cardiovascular", kind: "faq", title: "فشار خون بالا چه علائمی دارد؟", body: "فشار خون بالا اغلب بدون علامت است و با اندازه‌گیری منظم فشار خون تشخیص داده می‌شود." },
  { id: "content-insulin-resistance", topicSlug: "diabetes", kind: "article", title: "راهنمای بالینی مدیریت مقاومت به انسولین و دیابت", body: "مقاومت به انسولین شایع‌ترین اختلال متابولیک در جوامع امروزی است. با اصلاح مصرف نان و برنج سنتی و کاهش ۵ تا ۷ درصدی وزن، حساسیت سلولی به انسولین احیا می‌شود." },
  { id: "content-fatty-liver", topicSlug: "gi-disease", kind: "article", title: "کنترل کبد چرب گرید ۱ و ۲ در سفره ایرانی", body: "کبد چرب ناشی از تجمع تری‌گلیسرید داخل بافت کبد است. جایگزینی روغن‌های صنعتی با روغن زیتون فرابکر و ورزش منظم روزانه مهم‌ترین رکن درمان است." },
  { id: "content-persian-rice-calories", topicSlug: "fitness", kind: "article", title: "کالری پلوهای سنتی و راه‌های کاهش بار گلیسمی", body: "ترکیب برنج سنتی با شوید، عدس یا سبوس برنج باعث افزایش نشاسته مقاوم و کاهش قله انسولینی پس از وعده غذایی می‌شود." },
];

// Ruling 4: condition row id equals the topic's published article content id
// so the hub query (content id -> condition) is demonstrable without a join table.
const CONDITIONS: Array<{ id: string; slug: string; name: string }> = [
  { id: "content-diabetes-1", slug: "diabetes", name: "دیابت" },
  { id: "content-cardiovascular-1", slug: "cardiovascular", name: "قلب و عروق" },
  { id: "content-fatty-liver", slug: "fatty-liver", name: "کبد چرب غیرالکلی" },
];

async function upsertTranslation(entityType: string, entityId: string, locale: string, field: string, value: string) {
  await db
    .insert(translations)
    .values({ entityType, entityId, locale, field, value })
    .onConflictDoUpdate({
      target: [
        translations.entityType,
        translations.entityId,
        translations.locale,
        translations.field,
      ],
      set: { value },
    });
}

// F-026 integration registry: empty url = not configured; footer/table render only non-empty.
const SETTINGS: Array<{ id: string; key: string }> = [
  { id: "setting-regim24", key: "regim24" },
  { id: "setting-nobat24", key: "nobat24" },
  { id: "setting-aparat", key: "aparat" },
  { id: "setting-leaflet", key: "leaflet" },
  { id: "setting-enamad", key: "enamad" },
  { id: "setting-social", key: "social" },
];

async function main() {
  for (const t of TOPICS) {
    await db.insert(topics).values(t).onConflictDoUpdate({ target: topics.id, set: { slug: t.slug, name: t.name } });
  }

  for (const c of CONTENT) {
    await db
      .insert(contents)
      .values({
        id: c.id,
        kind: c.kind,
        slug: c.id,
        title: c.title,
        body: c.body,
        status: "published",
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: contents.id,
        set: { kind: c.kind, slug: c.id, title: c.title, body: c.body, status: "published" },
      });
    await db
      .insert(contentTopics)
      .values({ contentId: c.id, topicId: `topic-${c.topicSlug}` })
      .onConflictDoNothing();
  }

  for (const cond of CONDITIONS) {
    await db.insert(conditions).values(cond).onConflictDoUpdate({ target: conditions.id, set: { slug: cond.slug, name: cond.name } });
  }

  for (const s of SETTINGS) {
    await db
      .insert(settings)
      .values({ id: s.id, key: s.key, valueJson: { url: "" }, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settings.id, set: { key: s.key } });
  }

  // Ruling 5: prove the translation overlay on the diabetes article title.
  await upsertTranslation("content", "content-diabetes-1", "en", "title", "What is diabetes?");
  await upsertTranslation("content", "content-diabetes-1", "ar", "title", "ما هو مرض السكري؟");

  console.log(`seeded ${TOPICS.length} topics, ${CONTENT.length} contents, ${CONDITIONS.length} conditions, ${SETTINGS.length} settings`);
}

main().then(() => process.exit(0));