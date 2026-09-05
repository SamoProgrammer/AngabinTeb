import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";

export async function signSessionToken(token: string): Promise<string> {
  const secret = process.env.BETTER_AUTH_SECRET || "angabin-teb-dev-secret-key-32chars-min!!";
  const algorithm = { name: "HMAC", hash: "SHA-256" };
  const secretBuf = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey("raw", secretBuf, algorithm, false, ["sign"]);
  const signature = await crypto.subtle.sign(algorithm.name, key, new TextEncoder().encode(token));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${token}.${signatureB64}`;
}

export async function POST() {
  await db.insert(users).values({
    id: "test-patient",
    name: "Test Patient",
    phoneNumber: "09120000001",
    phoneNumberVerified: true,
    role: "patient",
  }).onConflictDoUpdate({ target: users.id, set: { role: "patient" } });

  const token = randomUUID();
  await db.insert(sessions).values({
    id: randomUUID(),
    token,
    userId: "test-patient",
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  }).onConflictDoNothing();

  const signedCookie = await signSessionToken(token);

  const res = NextResponse.json({ token, signedCookie });
  res.cookies.set("better-auth.session_token", signedCookie, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 86400,
  });
  return res;
}