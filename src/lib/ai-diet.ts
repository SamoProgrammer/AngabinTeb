import "server-only";

import { generateText, type LanguageModel } from "ai";
import type { clinicalRegistries } from "@/db/schema";

export const DIET_PROMPT_VERSION = "v1";

export const DIET_DOC_FOOTER =
  "پیش‌نویس تولیدشده با هوش مصنوعی — نیازمند بازبینی متخصص.";

export const DIET_SYSTEM =
  "شما متخصص تغذیه بالینی هستید که برای بیماران ایرانی برنامه غذایی می‌نویسید. پاسخ را فقط به زبان فارسی، به‌صورت متن ساده و ساخت‌یافته بنویسید؛ بدون JSON و بدون اصطلاحات انگلیسی.";

export type DietPromptInput = {
  sex: "male" | "female";
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  programType: string;
  registrySummary: string;
  periodSummary?: string;
};

const ACTIVITY_FA: Record<string, string> = {
  sedentary: "کم‌تحرک",
  light: "سبک",
  moderate: "متوسط",
  active: "فعال",
  very_active: "خیلی فعال",
};

export function buildDietPrompt(input: DietPromptInput): string {
  const lines = [
    `نوع برنامه: ${input.programType || "عمومی"}`,
    `جنسیت: ${input.sex === "female" ? "زن" : "مرد"}، سن: ${String(input.age)} سال، وزن: ${String(input.weightKg)} کیلوگرم، قد: ${String(input.heightCm)} سانتی‌متر، سطح فعالیت: ${ACTIVITY_FA[input.activityLevel] ?? input.activityLevel}`,
    `یادداشت پرونده بالینی: ${input.registrySummary.trim() || "ثبت نشده است"}`,
  ];
  if (input.periodSummary?.trim()) {
    lines.push(`خلاصه دوره‌های ثبت خوراک: ${input.periodSummary.trim()}`);
  }
  lines.push(
    "برنامه را روزبه‌روز و با جزئیات کامل بنویس؛ برای هر روز هر سه وعده اصلی و میان‌وعده‌ها را با مقادیر دقیق مشخص کن.",
    "مقادیر را فقط با واحدهای سنتی ایرانی بیان کن: کف دست، لیوان، قاشق غذاخوری، بشقاب و پیاله.",
    "در پایان هر روز جمع کالری و درشت‌مغذی‌ها را بنویس و موارد منع مصرف پرونده بالینی را رعایت کن.",
  );
  return lines.join("\n");
}

type RegistryRow = typeof clinicalRegistries.$inferSelect;

// One-line-per-section flattening of the dossier jsonb columns that exist
// today (person_info, medical_history, drug_history, ...). Invents nothing:
// only truthy stored answers are listed.
export function summarizeRegistry(row: RegistryRow | null | undefined): string {
  if (!row) return "";
  const sections: Array<[string, unknown]> = [
    ["مشخصات فردی", row.personInfo],
    ["سابقه پزشکی", row.medicalHistory],
    ["سابقه دارویی", row.drugHistory],
    ["سابقه اعتیاد", row.addictionHistory],
    ["اطلاعات تغذیه‌ای", row.nutritionInfo],
    ["پرسش‌های قلبی‌عروقی", row.cardiovascularQuestions],
    ["تن‌سنجی", row.anthropometric],
    ["مدارک پزشکی", row.medicalDocuments],
  ];
  const out: string[] = [];
  for (const [title, blob] of sections) {
    if (!blob || typeof blob !== "object") continue;
    const parts = Object.entries(blob as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    if (parts.length > 0) out.push(`${title} — ${parts.join("؛ ")}`);
  }
  return out.join("\n");
}

async function resolveModel(id: string): Promise<LanguageModel> {
  const apiKey = process.env.AI_API_KEY ?? "";
  const baseURL = process.env.AI_BASE_URL?.trim();
  if (baseURL) {
    // Custom OpenAI-compatible endpoint (proxy, local model, …): the
    // provider prefix (if any) is not part of the model name there.
    const { createOpenAI } = await import("@ai-sdk/openai");
    const name = id.includes("/") ? id.slice(id.indexOf("/") + 1) : id;
    return createOpenAI({ baseURL, apiKey })(name);
  }
  // AI Gateway reads AI_GATEWAY_API_KEY; accept AI_API_KEY as its alias so
  // one key var covers both paths (never overrides an explicit gateway key).
  // Dynamic import on purpose: tests mock only `generateText` from "ai",
  // so a static `gateway` import would break them. Production resolves the
  // AI Gateway model; without it the id is passed through (mocked in tests).
  process.env.AI_GATEWAY_API_KEY ??= apiKey;
  try {
    const mod = (await import("ai")) as { gateway?: (modelId: string) => LanguageModel };
    if (typeof mod.gateway === "function") return mod.gateway(id);
  } catch {
    // Partial "ai" mocks (tests) expose no gateway — fall through.
  }
  return id as unknown as LanguageModel;
}

export async function generateDietPlan(prompt: string): Promise<string> {
  if (!process.env.AI_API_KEY) {
    throw new Error("AI_API_KEY is not set — diet generation needs a model key");
  }
  const modelId = process.env.AI_MODEL ?? "openai/gpt-5.4";
  const { text } = await generateText({
    model: await resolveModel(modelId),
    maxOutputTokens: 8000,
    system: DIET_SYSTEM,
    prompt,
  });
  return text;
}
