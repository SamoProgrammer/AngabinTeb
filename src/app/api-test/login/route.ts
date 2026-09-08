import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { makeSignature } from "better-auth/crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  let requestedRole = url.searchParams.get("role");
  if (!requestedRole) {
    try {
      const body = await req.json();
      requestedRole = body?.role;
    } catch {
      // Empty or non-JSON body
    }
  }

  const isAdmin = requestedRole === "admin";
  const userId = isAdmin ? "admin-seed" : "test-patient";
  const userName = isAdmin ? "Administrator" : "Test Patient";
  const phone = isAdmin ? "09120000000" : "09120000001";
  const role = isAdmin ? "admin" : "patient";

  await db.insert(users).values({
    id: userId,
    name: userName,
    phoneNumber: phone,
    phoneNumberVerified: true,
    role,
  }).onConflictDoUpdate({ target: users.id, set: { role } });

  const token = randomUUID();
  await db.insert(sessions).values({
    id: randomUUID(),
    token,
    userId,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  }).onConflictDoNothing();

  const secret = process.env.BETTER_AUTH_SECRET || "angabin-teb-dev-secret-key-32chars-min!!";
  const signedCookie = `${token}.${await makeSignature(token, secret)}`;

  const res = NextResponse.json({ token, signedCookie, role, userId });
  res.cookies.set("better-auth.session_token", signedCookie, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 86400,
  });
  return res;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const isAdmin = url.searchParams.get("role") === "admin";
  const userId = isAdmin ? "admin-seed" : "test-patient";
  const userName = isAdmin ? "Administrator" : "Test Patient";
  const phone = isAdmin ? "09120000000" : "09120000001";
  const role = isAdmin ? "admin" : "patient";

  await db.insert(users).values({
    id: userId,
    name: userName,
    phoneNumber: phone,
    phoneNumberVerified: true,
    role,
  }).onConflictDoUpdate({ target: users.id, set: { role } });

  const token = randomUUID();
  await db.insert(sessions).values({
    id: randomUUID(),
    token,
    userId,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  }).onConflictDoNothing();

  const secret = process.env.BETTER_AUTH_SECRET || "angabin-teb-dev-secret-key-32chars-min!!";
  const signedCookie = `${token}.${await makeSignature(token, secret)}`;

  const target = isAdmin ? "/fa/admin" : "/fa/profile/reservations";
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.set("better-auth.session_token", signedCookie, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 86400,
  });
  return res;
}