"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, clinicalRegistries } from "@/db/schema";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/signin`);
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if ((user as { role?: string }).role !== "admin") redirect("/");
  return user;
}

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nationalId: z.string().trim().max(20).optional(),
  fatherName: z.string().trim().max(120).optional(),
  gender: z.enum(["male", "female"]).optional(),
});

function parseOrError<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => i.message).join("; ") };
  return { ok: true, data: r.data };
}

// Persists the profile fields that actually exist on the user row
// (name, national_id, father_name, gender). Phone stays read-only:
// it is the OTP identity and is never edited here.
export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const user = await requireUser();
  const parsed = parseOrError(profileSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db
    .update(users)
    .set({
      name: data.name,
      nationalId: data.nationalId?.trim() ? data.nationalId : null,
      fatherName: data.fatherName?.trim() ? data.fatherName : null,
      gender: data.gender ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  return { ok: true as const };
}

// 8-stage clinical dossier wizard payload, persisted best-effort across the
// registry jsonb columns. Single upsert per user (one dossier each).
export async function submitRegistry(payload: Record<string, unknown>) {
  const user = await requireUser();
  const p = payload ?? {};
  const str = (v: unknown) => (typeof v === "string" ? v : v == null ? null : String(v));
  const bool = (v: unknown) => v === true;
  const id = randomUUID();
  const now = new Date();
  const values = {
    userId: user.id,
    status: "submitted",
    personInfo: {
      fullName: str(p.fullName), nationalId: str(p.nationalId), gender: str(p.gender),
      age: str(p.age), height: str(p.height), weight: str(p.weight),
      maritalStatus: str(p.maritalStatus), emergencyPhone: str(p.emergencyPhone),
    },
    medicalHistory: {
      hasDiabetes: bool(p.hasDiabetes), hasHypertension: bool(p.hasHypertension),
      hasFattyLiver: bool(p.hasFattyLiver), fattyLiverGrade: str(p.fattyLiverGrade),
      hasThyroid: bool(p.hasThyroid), hasHeartDisease: bool(p.hasHeartDisease),
      hasKidneyDisease: bool(p.hasKidneyDisease), medicalNotes: str(p.medicalNotes),
      hadSurgery: bool(p.hadSurgery), surgeries: str(p.surgeries),
      hadBariatricSurgery: bool(p.hadBariatricSurgery), hospitalizations: str(p.hospitalizations),
    },
    drugHistory: {
      currentDrugs: str(p.currentDrugs), supplements: str(p.supplements), allergies: str(p.allergies),
    },
    nutritionInfo: {
      dailyMeals: str(p.dailyMeals), waterIntakeGlasses: str(p.waterIntakeGlasses),
      cravingType: str(p.cravingType), fastFoodPerWeek: str(p.fastFoodPerWeek), smoking: bool(p.smoking),
    },
    anthropometric: {
      height: str(p.height), weight: str(p.weight), sittingHours: str(p.sittingHours),
      sportsPerWeek: str(p.sportsPerWeek), sportsType: str(p.sportsType), jointPain: bool(p.jointPain),
    },
    medicalDocuments: {
      labs: {
        fbs: str(p.fbs), hba1c: str(p.hba1c), cholesterol: str(p.cholesterol),
        triglycerides: str(p.triglycerides), alt: str(p.alt), vitaminD: str(p.vitaminD),
      },
      labFileName: str((p as Record<string, unknown>).labFileName),
    },
    updatedAt: now,
    submittedAt: now,
  };
  const [existing] = await db.select({ id: clinicalRegistries.id }).from(clinicalRegistries).where(eq(clinicalRegistries.userId, user.id));
  if (existing) {
    await db.update(clinicalRegistries).set(values).where(eq(clinicalRegistries.id, existing.id));
    return { ok: true as const, id: existing.id };
  }
  await db.insert(clinicalRegistries).values({ id, ...values });
  return { ok: true as const, id };
}