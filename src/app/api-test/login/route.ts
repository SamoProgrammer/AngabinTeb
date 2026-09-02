import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
// ponytail: test-only route, delete when e2e is stable

export async function POST() {
  await db.insert(users).values({
    id: "test-patient", name: "Test Patient", phoneNumber: "09120000001",
    phoneNumberVerified: true, role: "patient",
  }).onConflictDoUpdate({ target: users.id, set: { role: "patient" } });
  const token = randomUUID();
  await db.insert(sessions).values({
    id: randomUUID(), token, userId: "test-patient",
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  }).onConflictDoNothing();
  return NextResponse.json({ token });
}