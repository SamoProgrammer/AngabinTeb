import "dotenv/config";
import { db } from "../src/db";
import {
  nutrients,
  foods,
  servingUnits,
  foodNutrients,
  nutrientRequirements,
  dietPrograms,
} from "../src/db/schema";

// SOURCE: USDA FoodData Central (FDC) 2024-04-18   RDA: WHO/FAO
// ponytail: 50-100 foods is the ceiling (spec §13 risk 2); expand via admin UI, not seed size.

const NUTRIENTS = [
  { id: "n-energy", slug: "energy", name: "انرژی", unit: "kcal" },
  { id: "n-carbs", slug: "carbs", name: "کربوهیدرات", unit: "g" },
  { id: "n-protein", slug: "protein", name: "پروتئین", unit: "g" },
  { id: "n-fat", slug: "fat", name: "چربی", unit: "g" },
  { id: "n-fiber", slug: "fiber", name: "فیبر", unit: "g" },
  { id: "n-iron", slug: "iron", name: "آهن", unit: "mg" },
  { id: "n-calcium", slug: "calcium", name: "کلسیم", unit: "mg" },
  { id: "n-vitc", slug: "vitamin_c", name: "ویتامین C", unit: "mg" },
];

async function upsertNutrients() {
  for (const n of NUTRIENTS) {
    await db.insert(nutrients).values(n).onConflictDoUpdate({ target: nutrients.id, set: { slug: n.slug, name: n.name, unit: n.unit } });
  }
}

// WHO/FAO recommended intakes; per-100g values approximated from USDA FDC for
// the standard recipe / ingredient composition of each dish.
const REQUIREMENTS: Array<{ nutrientId: string; sex: string; ageMin: number; ageMax: number; amount: number; source: string }> = [
  { nutrientId: "n-fiber", sex: "any", ageMin: 0, ageMax: 200, amount: 25, source: "who-fao" },
  { nutrientId: "n-iron", sex: "male", ageMin: 19, ageMax: 200, amount: 8, source: "who-fao" },
  { nutrientId: "n-iron", sex: "female", ageMin: 19, ageMax: 50, amount: 18, source: "who-fao" },
  { nutrientId: "n-iron", sex: "female", ageMin: 51, ageMax: 200, amount: 8, source: "who-fao" },
  { nutrientId: "n-calcium", sex: "any", ageMin: 19, ageMax: 200, amount: 1000, source: "who-fao" },
  { nutrientId: "n-vitc", sex: "any", ageMin: 0, ageMax: 200, amount: 45, source: "who-fao" },
];

async function upsertRequirements() {
  for (const r of REQUIREMENTS) {
    await db
      .insert(nutrientRequirements)
      .values({ nutrientId: r.nutrientId, sex: r.sex, ageMin: r.ageMin, ageMax: r.ageMax, amount: String(r.amount), source: r.source })
      .onConflictDoUpdate({
        target: [nutrientRequirements.nutrientId, nutrientRequirements.sex, nutrientRequirements.ageMin],
        set: { ageMax: r.ageMax, amount: String(r.amount), source: r.source },
      });
  }
}

const DIET_PROGRAMS: Array<{
  id: string; name: string; organizationContext: string; planType: string;
  durationDays: number; price: string; practitionerId: string | null; description: string;
}> = [
  {
    id: "dp-clinic-weightloss", name: "رژیم کاهش وزن", organizationContext: "clinics",
    planType: "weight_loss", durationDays: 30, price: "0", practitionerId: null,
    description: "برنامه کاهش وزن تحت نظر متخصص تغذیه",
  },
  {
    id: "dp-university-balance", name: "رژیم متعادل دانشجویی", organizationContext: "universities",
    planType: "balanced", durationDays: 14, price: "0", practitionerId: null,
    description: "برنامه تغذیه متعادل و مقرون به صرفه برای دانشجویان",
  },
  {
    id: "dp-bank-wellness", name: "برنامه تندرستی کارکنان", organizationContext: "banks",
    planType: "wellness", durationDays: 30, price: "0", practitionerId: null,
    description: "برنامه تندرستی و تغذیه سالم برای کارکنان",
  },
  {
    id: "dp-other-general", name: "برنامه سلامت عمومی", organizationContext: "other",
    planType: "general", durationDays: 21, price: "0", practitionerId: null,
    description: "برنامه سلامت عمومی و تغذیه متعادل",
  },
];

async function upsertDietPrograms() {
  for (const p of DIET_PROGRAMS) {
    await db.insert(dietPrograms).values(p).onConflictDoNothing();
  }
}

// One food, fully specified — the template every seeded food follows.
const FOODS: Array<{
  id: string; name: string; category: string; mealTypes: string[];
  per100g: Record<string, number>;
  servingUnits: Array<{ id: string; name: string; grams: number }>;
}> = [
  {
    id: "food-ash-reshteh", name: "آش رشته", category: "soup", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 92, "n-carbs": 12, "n-protein": 3.1, "n-fat": 3.6, "n-fiber": 2.1, "n-iron": 1.2, "n-calcium": 28, "n-vitc": 0 },
    servingUnits: [
      { id: "su-ash-plate", name: "بشقاب", grams: 300 },
      { id: "su-ash-ladle", name: "ملاقه", grams: 120 },
      { id: "su-ash-spoon", name: "قاشق", grams: 15 },
      { id: "su-ash-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-chelo-kateh", name: "چلو کته زعفرانی", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 140, "n-carbs": 30, "n-protein": 2.7, "n-fat": 1.1, "n-fiber": 0.4, "n-iron": 0.5, "n-calcium": 10, "n-vitc": 0 },
    servingUnits: [
      { id: "su-kateh-kafgeer", name: "کفگیر", grams: 70 },
      { id: "su-kateh-plate", name: "بشقاب", grams: 250 },
      { id: "su-kateh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-tahchin", name: "ته‌چین سنتی", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 210, "n-carbs": 26, "n-protein": 8.5, "n-fat": 8.2, "n-fiber": 0.6, "n-iron": 1.1, "n-calcium": 35, "n-vitc": 1 },
    servingUnits: [
      { id: "su-tahchin-slice", name: "برش", grams: 150 },
      { id: "su-tahchin-plate", name: "بشقاب", grams: 300 },
      { id: "su-tahchin-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ghormeh-sabzi", name: "قورمه‌سبزی", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 165, "n-carbs": 6.5, "n-protein": 11.2, "n-fat": 10.5, "n-fiber": 3.2, "n-iron": 2.8, "n-calcium": 45, "n-vitc": 4 },
    servingUnits: [
      { id: "su-ghormeh-bowl", name: "پیاله", grams: 150 },
      { id: "su-ghormeh-plate", name: "بشقاب", grams: 250 },
      { id: "su-ghormeh-ladle", name: "ملاقه", grams: 100 },
      { id: "su-ghormeh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-mast-khiar", name: "ماست و خیار با نعناع", category: "dairy", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 65, "n-carbs": 4.5, "n-protein": 3.8, "n-fat": 3.2, "n-fiber": 0.5, "n-iron": 0.2, "n-calcium": 120, "n-vitc": 2 },
    servingUnits: [
      { id: "su-mast-bowl", name: "پیاله", grams: 150 },
      { id: "su-mast-spoon", name: "قاشق", grams: 25 },
      { id: "su-mast-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-barbari", name: "نان بربری", category: "bread", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 260, "n-carbs": 55, "n-protein": 8.5, "n-fat": 1.2, "n-fiber": 2, "n-iron": 1.8, "n-calcium": 30, "n-vitc": 0 },
    servingUnits: [
      { id: "su-barbari-piece", name: "تکه", grams: 50 },
      { id: "su-barbari-loaf", name: "قرص", grams: 400 },
      { id: "su-barbari-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-sangak", name: "نان سنگک", category: "bread", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 258, "n-carbs": 56, "n-protein": 9, "n-fat": 1, "n-fiber": 2.5, "n-iron": 2.2, "n-calcium": 25, "n-vitc": 0 },
    servingUnits: [
      { id: "su-sangak-piece", name: "تکه", grams: 50 },
      { id: "su-sangak-loaf", name: "قرص", grams: 250 },
      { id: "su-sangak-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-lavash", name: "نان لواش", category: "bread", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 280, "n-carbs": 58, "n-protein": 9.5, "n-fat": 1.5, "n-fiber": 2, "n-iron": 2.1, "n-calcium": 20, "n-vitc": 0 },
    servingUnits: [
      { id: "su-lavash-piece", name: "تکه", grams: 25 },
      { id: "su-lavash-sheet", name: "ورقه", grams: 50 },
      { id: "su-lavash-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-taftoon", name: "نان تافتون", category: "bread", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 265, "n-carbs": 55, "n-protein": 9, "n-fat": 1.2, "n-fiber": 2.2, "n-iron": 2, "n-calcium": 28, "n-vitc": 0 },
    servingUnits: [
      { id: "su-taftoon-piece", name: "تکه", grams: 50 },
      { id: "su-taftoon-loaf", name: "قرص", grams: 300 },
      { id: "su-taftoon-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-omelet", name: "املت", category: "breakfast", mealTypes: ["breakfast"],
    per100g: { "n-energy": 120, "n-carbs": 2.5, "n-protein": 7.5, "n-fat": 9, "n-fiber": 0.6, "n-iron": 1.6, "n-calcium": 45, "n-vitc": 9 },
    servingUnits: [
      { id: "su-omelet-plate", name: "بشقاب", grams: 250 },
      { id: "su-omelet-egg", name: "عدد", grams: 100 },
      { id: "su-omelet-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-egg-boiled", name: "تخم‌مرغ آب‌پز", category: "breakfast", mealTypes: ["breakfast"],
    per100g: { "n-energy": 155, "n-carbs": 1.1, "n-protein": 13, "n-fat": 11, "n-fiber": 0, "n-iron": 1.2, "n-calcium": 50, "n-vitc": 0 },
    servingUnits: [
      { id: "su-egg-boiled-one", name: "یک عدد", grams: 50 },
      { id: "su-egg-boiled-two", name: "دو عدد", grams: 100 },
      { id: "su-egg-boiled-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-honey", name: "عسل", category: "breakfast", mealTypes: ["breakfast"],
    per100g: { "n-energy": 304, "n-carbs": 82.4, "n-protein": 0.3, "n-fat": 0, "n-fiber": 0.2, "n-iron": 0.4, "n-calcium": 6, "n-vitc": 0.5 },
    servingUnits: [
      { id: "su-honey-tbsp", name: "قاشق غذاخوری", grams: 21 },
      { id: "su-honey-tsp", name: "قاشق مرباخوری", grams: 7 },
      { id: "su-honey-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-butter", name: "کره", category: "breakfast", mealTypes: ["breakfast"],
    per100g: { "n-energy": 717, "n-carbs": 0.1, "n-protein": 0.9, "n-fat": 81, "n-fiber": 0, "n-iron": 0, "n-calcium": 24, "n-vitc": 0 },
    servingUnits: [
      { id: "su-butter-tbsp", name: "قاشق غذاخوری", grams: 14 },
      { id: "su-butter-tsp", name: "قاشق مرباخوری", grams: 5 },
      { id: "su-butter-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-cheese-white", name: "پنیر سفید", category: "breakfast", mealTypes: ["breakfast"],
    per100g: { "n-energy": 250, "n-carbs": 2, "n-protein": 20, "n-fat": 18, "n-fiber": 0, "n-iron": 0.2, "n-calcium": 500, "n-vitc": 0 },
    servingUnits: [
      { id: "su-cheese-white-piece", name: "تکه", grams: 30 },
      { id: "su-cheese-white-slice", name: "برش", grams: 20 },
      { id: "su-cheese-white-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ghormeh-sabzi", name: "قورمه سبزی", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 170, "n-carbs": 8, "n-protein": 12, "n-fat": 10, "n-fiber": 3, "n-iron": 2.6, "n-calcium": 30, "n-vitc": 6 },
    servingUnits: [
      { id: "su-gs-plate", name: "بشقاب", grams: 300 },
      { id: "su-gs-ladle", name: "ملاقه", grams: 100 },
      { id: "su-gs-spoon", name: "قاشق", grams: 15 },
      { id: "su-gs-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-gheymeh", name: "قیمه", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 210, "n-carbs": 12, "n-protein": 15, "n-fat": 11, "n-fiber": 2.5, "n-iron": 2.2, "n-calcium": 25, "n-vitc": 3 },
    servingUnits: [
      { id: "su-gheymeh-plate", name: "بشقاب", grams: 300 },
      { id: "su-gheymeh-ladle", name: "ملاقه", grams: 100 },
      { id: "su-gheymeh-spoon", name: "قاشق", grams: 15 },
      { id: "su-gheymeh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-fesenjan", name: "فسنجان", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 280, "n-carbs": 13, "n-protein": 15, "n-fat": 20, "n-fiber": 3, "n-iron": 2.6, "n-calcium": 22, "n-vitc": 2 },
    servingUnits: [
      { id: "su-fesenjan-plate", name: "بشقاب", grams: 280 },
      { id: "su-fesenjan-ladle", name: "ملاقه", grams: 90 },
      { id: "su-fesenjan-spoon", name: "قاشق", grams: 15 },
      { id: "su-fesenjan-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-khoresht-bademjan", name: "خورش بادمجان", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 160, "n-carbs": 10, "n-protein": 9, "n-fat": 10, "n-fiber": 3.5, "n-iron": 1.4, "n-calcium": 30, "n-vitc": 5 },
    servingUnits: [
      { id: "su-bademjan-plate", name: "بشقاب", grams: 300 },
      { id: "su-bademjan-ladle", name: "ملاقه", grams: 100 },
      { id: "su-bademjan-spoon", name: "قاشق", grams: 15 },
      { id: "su-bademjan-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-khoresht-karafs", name: "خورش کرفس", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 140, "n-carbs": 9, "n-protein": 10, "n-fat": 8, "n-fiber": 2.5, "n-iron": 1.8, "n-calcium": 40, "n-vitc": 6 },
    servingUnits: [
      { id: "su-karafs-plate", name: "بشقاب", grams: 300 },
      { id: "su-karafs-ladle", name: "ملاقه", grams: 100 },
      { id: "su-karafs-spoon", name: "قاشق", grams: 15 },
      { id: "su-karafs-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-khoresht-morgh", name: "خورش مرغ", category: "stew", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 180, "n-carbs": 9, "n-protein": 16, "n-fat": 9, "n-fiber": 1.5, "n-iron": 1.3, "n-calcium": 20, "n-vitc": 3 },
    servingUnits: [
      { id: "su-khmorgh-plate", name: "بشقاب", grams: 300 },
      { id: "su-khmorgh-ladle", name: "ملاقه", grams: 100 },
      { id: "su-khmorgh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-chelo-kabab", name: "چلوکباب", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 300, "n-carbs": 30, "n-protein": 15, "n-fat": 13, "n-fiber": 1.5, "n-iron": 2, "n-calcium": 20, "n-vitc": 1 },
    servingUnits: [
      { id: "su-chelo-order", name: "پرس", grams: 450 },
      { id: "su-chelo-plate", name: "بشقاب", grams: 300 },
      { id: "su-chelo-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-tahchin", name: "ته‌چین", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 260, "n-carbs": 22, "n-protein": 13, "n-fat": 13, "n-fiber": 1, "n-iron": 1.5, "n-calcium": 70, "n-vitc": 0 },
    servingUnits: [
      { id: "su-tahchin-piece", name: "تکه", grams: 200 },
      { id: "su-tahchin-spatula", name: "کفگیر", grams: 150 },
      { id: "su-tahchin-plate", name: "بشقاب", grams: 250 },
      { id: "su-tahchin-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-zereshk-polo", name: "زرشک‌پلو", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 230, "n-carbs": 34, "n-protein": 5, "n-fat": 9, "n-fiber": 1.5, "n-iron": 1.2, "n-calcium": 14, "n-vitc": 1 },
    servingUnits: [
      { id: "su-zereshk-plate", name: "بشقاب", grams: 250 },
      { id: "su-zereshk-ladle", name: "ملاقه", grams: 100 },
      { id: "su-zereshk-spatula", name: "کفگیر", grams: 120 },
      { id: "su-zereshk-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-baghali-polo", name: "باقالی‌پلو", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 200, "n-carbs": 31, "n-protein": 7, "n-fat": 6, "n-fiber": 4, "n-iron": 1.8, "n-calcium": 40, "n-vitc": 2 },
    servingUnits: [
      { id: "su-baghali-plate", name: "بشقاب", grams: 250 },
      { id: "su-baghali-ladle", name: "ملاقه", grams: 100 },
      { id: "su-baghali-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-sabzi-polo", name: "سبزی‌پلو", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 220, "n-carbs": 33, "n-protein": 6, "n-fat": 8, "n-fiber": 3, "n-iron": 2, "n-calcium": 30, "n-vitc": 4 },
    servingUnits: [
      { id: "su-sabzipolo-plate", name: "بشقاب", grams: 250 },
      { id: "su-sabzipolo-ladle", name: "ملاقه", grams: 100 },
      { id: "su-sabzipolo-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ads-polo", name: "عدس‌پلو", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 240, "n-carbs": 36, "n-protein": 9, "n-fat": 7, "n-fiber": 4.5, "n-iron": 2.4, "n-calcium": 30, "n-vitc": 1 },
    servingUnits: [
      { id: "su-ads-plate", name: "بشقاب", grams: 250 },
      { id: "su-ads-ladle", name: "ملاقه", grams: 100 },
      { id: "su-ads-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-kateh", name: "کته", category: "rice", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 130, "n-carbs": 28.2, "n-protein": 2.7, "n-fat": 0.3, "n-fiber": 0.4, "n-iron": 0.2, "n-calcium": 10, "n-vitc": 0 },
    servingUnits: [
      { id: "su-kateh-plate", name: "بشقاب", grams: 250 },
      { id: "su-kateh-ladle", name: "ملاقه", grams: 120 },
      { id: "su-kateh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-soup-jow", name: "سوپ جو", category: "soup", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 60, "n-carbs": 10, "n-protein": 3, "n-fat": 1, "n-fiber": 2, "n-iron": 0.8, "n-calcium": 15, "n-vitc": 3 },
    servingUnits: [
      { id: "su-soupjow-plate", name: "بشقاب", grams: 250 },
      { id: "su-soupjow-bowl", name: "کاسه", grams: 200 },
      { id: "su-soupjow-ladle", name: "ملاقه", grams: 100 },
      { id: "su-soupjow-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-soup-vegetable", name: "سوپ سبزیجات", category: "soup", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 45, "n-carbs": 7, "n-protein": 2, "n-fat": 1, "n-fiber": 2.2, "n-iron": 0.7, "n-calcium": 20, "n-vitc": 8 },
    servingUnits: [
      { id: "su-soupveg-plate", name: "بشقاب", grams: 250 },
      { id: "su-soupveg-bowl", name: "کاسه", grams: 200 },
      { id: "su-soupveg-ladle", name: "ملاقه", grams: 100 },
      { id: "su-soupveg-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ash-shalgham", name: "آش شلغم", category: "soup", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 55, "n-carbs": 9, "n-protein": 2.2, "n-fat": 1.2, "n-fiber": 2.5, "n-iron": 0.8, "n-calcium": 32, "n-vitc": 12 },
    servingUnits: [
      { id: "su-shalgham-plate", name: "بشقاب", grams: 300 },
      { id: "su-shalgham-bowl", name: "کاسه", grams: 200 },
      { id: "su-shalgham-ladle", name: "ملاقه", grams: 120 },
      { id: "su-shalgham-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ash-jow", name: "آش جو", category: "soup", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 70, "n-carbs": 12, "n-protein": 2.5, "n-fat": 1.5, "n-fiber": 2, "n-iron": 0.9, "n-calcium": 15, "n-vitc": 1 },
    servingUnits: [
      { id: "su-ashjow-plate", name: "بشقاب", grams: 300 },
      { id: "su-ashjow-ladle", name: "ملاقه", grams: 120 },
      { id: "su-ashjow-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-salad-shirazi", name: "سالاد شیرازی", category: "salad", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 30, "n-carbs": 6, "n-protein": 1.2, "n-fat": 0.2, "n-fiber": 1.5, "n-iron": 0.5, "n-calcium": 20, "n-vitc": 15 },
    servingUnits: [
      { id: "su-shirazi-plate", name: "بشقاب", grams: 150 },
      { id: "su-shirazi-bowl", name: "کاسه", grams: 120 },
      { id: "su-shirazi-spoon", name: "قاشق", grams: 20 },
      { id: "su-shirazi-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-salad-olvie", name: "سالاد الویه", category: "salad", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 180, "n-carbs": 12, "n-protein": 6, "n-fat": 12, "n-fiber": 1.5, "n-iron": 1, "n-calcium": 30, "n-vitc": 4 },
    servingUnits: [
      { id: "su-olvie-plate", name: "بشقاب", grams: 150 },
      { id: "su-olvie-tbsp", name: "قاشق غذاخوری", grams: 30 },
      { id: "su-olvie-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-mast-khiar", name: "ماست و خیار", category: "salad", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 80, "n-carbs": 6, "n-protein": 3, "n-fat": 5, "n-fiber": 0.5, "n-iron": 0.3, "n-calcium": 70, "n-vitc": 2 },
    servingUnits: [
      { id: "su-mastkhiar-bowl", name: "کاسه", grams: 150 },
      { id: "su-mastkhiar-tbsp", name: "قاشق غذاخوری", grams: 30 },
      { id: "su-mastkhiar-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-salad-fasl", name: "سالاد فصل", category: "salad", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 35, "n-carbs": 7, "n-protein": 1, "n-fat": 0.3, "n-fiber": 2, "n-iron": 0.5, "n-calcium": 25, "n-vitc": 20 },
    servingUnits: [
      { id: "su-fasl-plate", name: "بشقاب", grams: 150 },
      { id: "su-fasl-bowl", name: "کاسه", grams: 120 },
      { id: "su-fasl-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-kabab-kubide", name: "کباب کوبیده", category: "meat", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 290, "n-carbs": 10, "n-protein": 16, "n-fat": 21, "n-fiber": 0.5, "n-iron": 2.1, "n-calcium": 15, "n-vitc": 0 },
    servingUnits: [
      { id: "su-kubide-skewer", name: "سیخ", grams: 100 },
      { id: "su-kubide-order", name: "پرس", grams: 350 },
      { id: "su-kubide-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-kabab-barg", name: "کباب برگ", category: "meat", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 250, "n-carbs": 2, "n-protein": 22, "n-fat": 17, "n-fiber": 0, "n-iron": 2.5, "n-calcium": 10, "n-vitc": 0 },
    servingUnits: [
      { id: "su-barg-skewer", name: "سیخ", grams: 80 },
      { id: "su-barg-order", name: "پرس", grams: 300 },
      { id: "su-barg-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-shishlik", name: "شیشلیک", category: "meat", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 270, "n-carbs": 4, "n-protein": 20, "n-fat": 19, "n-fiber": 0.2, "n-iron": 2.3, "n-calcium": 12, "n-vitc": 1 },
    servingUnits: [
      { id: "su-shishlik-skewer", name: "سیخ", grams: 120 },
      { id: "su-shishlik-order", name: "پرس", grams: 350 },
      { id: "su-shishlik-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-koofteh", name: "کوفته تبریزی", category: "meat", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 200, "n-carbs": 12, "n-protein": 12, "n-fat": 11, "n-fiber": 2, "n-iron": 2, "n-calcium": 25, "n-vitc": 3 },
    servingUnits: [
      { id: "su-koofteh-piece", name: "تکه", grams: 100 },
      { id: "su-koofteh-one", name: "یک عدد", grams: 250 },
      { id: "su-koofteh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-dizi", name: "دیزی", category: "meat", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 150, "n-carbs": 8, "n-protein": 10, "n-fat": 9, "n-fiber": 2.5, "n-iron": 1.5, "n-calcium": 25, "n-vitc": 2 },
    servingUnits: [
      { id: "su-dizi-order", name: "پرس", grams: 350 },
      { id: "su-dizi-bowl", name: "کاسه", grams: 250 },
      { id: "su-dizi-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-jujeh-kabab", name: "جوجه کباب", category: "chicken", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 180, "n-carbs": 2, "n-protein": 25, "n-fat": 8, "n-fiber": 0, "n-iron": 1, "n-calcium": 15, "n-vitc": 1 },
    servingUnits: [
      { id: "su-jujeh-skewer", name: "سیخ", grams: 90 },
      { id: "su-jujeh-order", name: "پرس", grams: 400 },
      { id: "su-jujeh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-chicken-fried", name: "مرغ سوخاری", category: "chicken", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 280, "n-carbs": 12, "n-protein": 20, "n-fat": 17, "n-fiber": 1, "n-iron": 1.2, "n-calcium": 20, "n-vitc": 0 },
    servingUnits: [
      { id: "su-fried-piece", name: "تکه", grams: 120 },
      { id: "su-fried-breast", name: "سینه", grams: 150 },
      { id: "su-fried-order", name: "پرس", grams: 200 },
      { id: "su-fried-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-morgh-torsh", name: "مرغ ترش", category: "chicken", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 190, "n-carbs": 8, "n-protein": 20, "n-fat": 9, "n-fiber": 1, "n-iron": 1.2, "n-calcium": 20, "n-vitc": 5 },
    servingUnits: [
      { id: "su-morghtorsh-piece", name: "تکه", grams: 150 },
      { id: "su-morghtorsh-order", name: "پرس", grams: 350 },
      { id: "su-morghtorsh-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ghazale-mahi", name: "قزل‌آلا", category: "fish", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 160, "n-carbs": 0, "n-protein": 22, "n-fat": 7, "n-fiber": 0, "n-iron": 0.7, "n-calcium": 30, "n-vitc": 1 },
    servingUnits: [
      { id: "su-ghazale-fillet", name: "فیله", grams: 150 },
      { id: "su-ghazale-one", name: "یک عدد", grams: 250 },
      { id: "su-ghazale-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-mahi-sefid", name: "ماهی سفید", category: "fish", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 130, "n-carbs": 0, "n-protein": 19, "n-fat": 5.5, "n-fiber": 0, "n-iron": 0.5, "n-calcium": 40, "n-vitc": 0 },
    servingUnits: [
      { id: "su-mahisefid-fillet", name: "فیله", grams: 150 },
      { id: "su-mahisefid-one", name: "یک عدد", grams: 350 },
      { id: "su-mahisefid-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-shrimp", name: "میگو", category: "fish", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 100, "n-carbs": 0.5, "n-protein": 20, "n-fat": 1.5, "n-fiber": 0, "n-iron": 2.5, "n-calcium": 90, "n-vitc": 0 },
    servingUnits: [
      { id: "su-shrimp-one", name: "یک عدد", grams: 20 },
      { id: "su-shrimp-plate", name: "بشقاب", grams: 150 },
      { id: "su-shrimp-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-mast", name: "ماست", category: "dairy", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 60, "n-carbs": 4.5, "n-protein": 3.5, "n-fat": 3.2, "n-fiber": 0, "n-iron": 0.1, "n-calcium": 120, "n-vitc": 1 },
    servingUnits: [
      { id: "su-mast-bowl", name: "کاسه", grams: 150 },
      { id: "su-mast-tbsp", name: "قاشق غذاخوری", grams: 30 },
      { id: "su-mast-cup", name: "پیمانه", grams: 200 },
      { id: "su-mast-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-dough", name: "دوغ", category: "dairy", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 30, "n-carbs": 2.5, "n-protein": 1.2, "n-fat": 1.2, "n-fiber": 0, "n-iron": 0.1, "n-calcium": 60, "n-vitc": 1 },
    servingUnits: [
      { id: "su-dough-glass", name: "لیوان", grams: 250 },
      { id: "su-dough-bottle", name: "بطری", grams: 500 },
      { id: "su-dough-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-milk", name: "شیر", category: "dairy", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 61, "n-carbs": 4.8, "n-protein": 3.2, "n-fat": 3.3, "n-fiber": 0, "n-iron": 0.05, "n-calcium": 120, "n-vitc": 0.5 },
    servingUnits: [
      { id: "su-milk-glass", name: "لیوان", grams: 250 },
      { id: "su-milk-cup", name: "پیمانه", grams: 200 },
      { id: "su-milk-bottle", name: "بطری", grams: 500 },
      { id: "su-milk-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-kashk", name: "کشک", category: "dairy", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 250, "n-carbs": 30, "n-protein": 22, "n-fat": 6, "n-fiber": 0, "n-iron": 1, "n-calcium": 600, "n-vitc": 0.5 },
    servingUnits: [
      { id: "su-kashk-tbsp", name: "قاشق غذاخوری", grams: 20 },
      { id: "su-kashk-ladle", name: "ملاقه", grams: 60 },
      { id: "su-kashk-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-sarshir", name: "سرشیر", category: "dairy", mealTypes: ["breakfast"],
    per100g: { "n-energy": 350, "n-carbs": 8, "n-protein": 4, "n-fat": 33, "n-fiber": 0, "n-iron": 0.2, "n-calcium": 150, "n-vitc": 0.5 },
    servingUnits: [
      { id: "su-sarshir-tbsp", name: "قاشق غذاخوری", grams: 30 },
      { id: "su-sarshir-tsp", name: "قاشق مرباخوری", grams: 10 },
      { id: "su-sarshir-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-shal-zard", name: "شله‌زرد", category: "dessert", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 180, "n-carbs": 38, "n-protein": 3, "n-fat": 1.5, "n-fiber": 1.5, "n-iron": 1, "n-calcium": 20, "n-vitc": 0 },
    servingUnits: [
      { id: "su-shalzard-bowl", name: "کاسه", grams: 150 },
      { id: "su-shalzard-tbsp", name: "قاشق غذاخوری", grams: 30 },
      { id: "su-shalzard-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-fernani", name: "فرنی", category: "dessert", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 120, "n-carbs": 20, "n-protein": 4, "n-fat": 2.5, "n-fiber": 0.3, "n-iron": 0.3, "n-calcium": 80, "n-vitc": 0 },
    servingUnits: [
      { id: "su-fernani-bowl", name: "کاسه", grams: 120 },
      { id: "su-fernani-tbsp", name: "قاشق غذاخوری", grams: 30 },
      { id: "su-fernani-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-halva", name: "حلوا", category: "dessert", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 430, "n-carbs": 60, "n-protein": 6, "n-fat": 19, "n-fiber": 2, "n-iron": 2.5, "n-calcium": 40, "n-vitc": 0 },
    servingUnits: [
      { id: "su-halva-piece", name: "تکه", grams: 50 },
      { id: "su-halva-tbsp", name: "قاشق غذاخوری", grams: 25 },
      { id: "su-halva-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-bastani", name: "بستنی سنتی", category: "dessert", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 210, "n-carbs": 25, "n-protein": 3, "n-fat": 11, "n-fiber": 0.5, "n-iron": 0.2, "n-calcium": 130, "n-vitc": 0.5 },
    servingUnits: [
      { id: "su-bastani-scoop", name: "اسکوپ", grams: 70 },
      { id: "su-bastani-glass", name: "لیوان", grams: 150 },
      { id: "su-bastani-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-pistachio", name: "پسته", category: "snack", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 570, "n-carbs": 28, "n-protein": 21, "n-fat": 45, "n-fiber": 10, "n-iron": 3.9, "n-calcium": 105, "n-vitc": 0.5 },
    servingUnits: [
      { id: "su-pistachio-handful", name: "مشت", grams: 25 },
      { id: "su-pistachio-cup", name: "لیوان", grams: 50 },
      { id: "su-pistachio-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-almond", name: "بادام", category: "snack", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 580, "n-carbs": 22, "n-protein": 21, "n-fat": 50, "n-fiber": 12.5, "n-iron": 3.7, "n-calcium": 270, "n-vitc": 0.3 },
    servingUnits: [
      { id: "su-almond-handful", name: "مشت", grams: 25 },
      { id: "su-almond-cup", name: "لیوان", grams: 50 },
      { id: "su-almond-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-gerdoo", name: "گردو", category: "snack", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 650, "n-carbs": 14, "n-protein": 15, "n-fat": 65, "n-fiber": 7, "n-iron": 2.9, "n-calcium": 98, "n-vitc": 1.3 },
    servingUnits: [
      { id: "su-gerdoo-one", name: "یک عدد", grams: 5 },
      { id: "su-gerdoo-handful", name: "مشت", grams: 25 },
      { id: "su-gerdoo-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-keshmish", name: "کشمش", category: "snack", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 300, "n-carbs": 79, "n-protein": 3, "n-fat": 0.5, "n-fiber": 3.7, "n-iron": 1.9, "n-calcium": 50, "n-vitc": 2.3 },
    servingUnits: [
      { id: "su-keshmish-handful", name: "مشت", grams: 20 },
      { id: "su-keshmish-tbsp", name: "قاشق غذاخوری", grams: 15 },
      { id: "su-keshmish-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-chips", name: "چیپس", category: "snack", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 540, "n-carbs": 53, "n-protein": 7, "n-fat": 35, "n-fiber": 4, "n-iron": 1.5, "n-calcium": 30, "n-vitc": 10 },
    servingUnits: [
      { id: "su-chips-pack", name: "بسته", grams: 60 },
      { id: "su-chips-bowl", name: "کاسه", grams: 40 },
      { id: "su-chips-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-chai", name: "چای", category: "drink", mealTypes: ["breakfast", "lunch", "dinner"],
    per100g: { "n-energy": 1, "n-carbs": 0.3, "n-protein": 0, "n-fat": 0, "n-fiber": 0, "n-iron": 0.1, "n-calcium": 1, "n-vitc": 0.1 },
    servingUnits: [
      { id: "su-chai-esteekan", name: "استکان", grams: 30 },
      { id: "su-chai-glass", name: "لیوان", grams: 200 },
      { id: "su-chai-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-ab-havij", name: "آب هویج", category: "drink", mealTypes: ["breakfast", "lunch"],
    per100g: { "n-energy": 40, "n-carbs": 9, "n-protein": 0.9, "n-fat": 0.2, "n-fiber": 0.8, "n-iron": 0.3, "n-calcium": 25, "n-vitc": 8 },
    servingUnits: [
      { id: "su-abhavij-glass", name: "لیوان", grams: 250 },
      { id: "su-abhavij-bottle", name: "بطری", grams: 500 },
      { id: "su-abhavij-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-sherbet-albalu", name: "شربت آلبالو", category: "drink", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 55, "n-carbs": 14, "n-protein": 0.2, "n-fat": 0, "n-fiber": 0.3, "n-iron": 0.3, "n-calcium": 8, "n-vitc": 2 },
    servingUnits: [
      { id: "su-albalu-glass", name: "لیوان", grams: 250 },
      { id: "su-albalu-esteekan", name: "استکان", grams: 60 },
      { id: "su-albalu-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-pizza", name: "پیتزا", category: "fast_food", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 270, "n-carbs": 30, "n-protein": 11, "n-fat": 11, "n-fiber": 2, "n-iron": 1.2, "n-calcium": 150, "n-vitc": 3 },
    servingUnits: [
      { id: "su-pizza-slice", name: "تکه", grams: 100 },
      { id: "su-pizza-half", name: "نصف", grams: 400 },
      { id: "su-pizza-whole", name: "عدد", grams: 800 },
      { id: "su-pizza-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-burger", name: "برگر", category: "fast_food", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 300, "n-carbs": 24, "n-protein": 14, "n-fat": 16, "n-fiber": 1.5, "n-iron": 1.8, "n-calcium": 120, "n-vitc": 2 },
    servingUnits: [
      { id: "su-burger-one", name: "یک عدد", grams: 250 },
      { id: "su-burger-half", name: "نصف", grams: 125 },
      { id: "su-burger-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-fries", name: "سیب‌زمینی سرخ‌کرده", category: "fast_food", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 310, "n-carbs": 40, "n-protein": 3.5, "n-fat": 15, "n-fiber": 3.5, "n-iron": 0.8, "n-calcium": 10, "n-vitc": 9 },
    servingUnits: [
      { id: "su-fries-plate", name: "بشقاب", grams: 150 },
      { id: "su-fries-cup", name: "پیمانه", grams: 100 },
      { id: "su-fries-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-makaroni", name: "ماکارونی", category: "international", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 180, "n-carbs": 25, "n-protein": 6, "n-fat": 6, "n-fiber": 1.5, "n-iron": 0.9, "n-calcium": 40, "n-vitc": 2 },
    servingUnits: [
      { id: "su-makaroni-plate", name: "بشقاب", grams: 300 },
      { id: "su-makaroni-ladle", name: "ملاقه", grams: 100 },
      { id: "su-makaroni-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-salad-caesar", name: "سالاد سزار", category: "international", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 120, "n-carbs": 6, "n-protein": 5, "n-fat": 9, "n-fiber": 1.2, "n-iron": 0.8, "n-calcium": 60, "n-vitc": 5 },
    servingUnits: [
      { id: "su-caesar-plate", name: "بشقاب", grams: 200 },
      { id: "su-caesar-bowl", name: "کاسه", grams: 150 },
      { id: "su-caesar-gram", name: "گرم", grams: 1 },
    ],
  },
  {
    id: "food-steak", name: "استیک", category: "international", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 270, "n-carbs": 0, "n-protein": 25, "n-fat": 18, "n-fiber": 0, "n-iron": 2.6, "n-calcium": 12, "n-vitc": 0 },
    servingUnits: [
      { id: "su-steak-piece", name: "تکه", grams: 200 },
      { id: "su-steak-order", name: "پرس", grams: 250 },
      { id: "su-steak-gram", name: "گرم", grams: 1 },
    ],
  },
];

async function main() {
  await upsertNutrients();
  await upsertRequirements();
  await upsertDietPrograms();
  for (const f of FOODS) {
    await db.insert(foods).values({
      id: f.id, name: f.name, category: f.category, mealTypes: f.mealTypes,
      source: "usda-fdc", sourceVersion: "2024-04-18",
    }).onConflictDoNothing();
    for (const su of f.servingUnits) {
      await db.insert(servingUnits).values({ id: su.id, foodId: f.id, name: su.name, gramsEquivalent: String(su.grams) })
        .onConflictDoNothing();
    }
    for (const [nutrientId, amount] of Object.entries(f.per100g)) {
      await db.insert(foodNutrients).values({ foodId: f.id, nutrientId, amountPer100g: String(amount) })
        .onConflictDoNothing();
    }
  }
  console.log(`seeded ${FOODS.length} foods`);
}

main().then(() => process.exit(0));