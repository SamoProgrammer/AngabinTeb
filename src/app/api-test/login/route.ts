import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
// ponytail: test-only route, delete when e2e is stable

export async function POST(req: NextRequest) {
  if (new URL(req.url).searchParams.get("role") === "provider") {
    await db.insert(users).values({
      id: "test-provider", name: "Test Provider", phoneNumber: "09120000002",
      phoneNumberVerified: true, role: "provider",
    }).onConflictDoUpdate({ target: users.id, set: { role: "provider" } });
    const token = randomUUID();
    await db.insert(sessions).values({
      id: randomUUID(), token, userId: "test-provider",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    }).onConflictDoNothing();
    return NextResponse.json({ token });
  }
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