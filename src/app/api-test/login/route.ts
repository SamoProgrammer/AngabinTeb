import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { makeSignature } from "better-auth/crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";

// Demo login is ON in dev, and in prod only with explicit opt-in:
// DEMO_LOGIN_ENABLED=true. Anyone with the URL can mint a session
// (including admin), so never enable it on a site with real patient data.
function isDemoLoginEnabled() {
  return process.env.DEMO_LOGIN_ENABLED === "true" || process.env.NODE_ENV !== "production";
}

// Mirrors better-auth's cookie naming (dist/cookies/index.mjs): __Secure-
// prefix + Secure flag whenever the base URL is https.
function getSessionCookie() {
  const secure = (process.env.BETTER_AUTH_URL || "http://localhost:3000").startsWith("https://");
  return { name: `${secure ? "__Secure-" : ""}better-auth.session_token`, secure };
}

export async function POST(req: Request) {
  if (!isDemoLoginEnabled()) {
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
  const sessionCookie = getSessionCookie();

  const res = NextResponse.json({ token, signedCookie, cookieName: sessionCookie.name, role, userId });
  res.cookies.set(sessionCookie.name, signedCookie, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookie.secure,
    maxAge: 86400,
  });
  return res;
}

export async function GET(req: Request) {
  if (!isDemoLoginEnabled()) {
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
  const sessionCookie = getSessionCookie();

  const target = isAdmin ? "/fa/admin" : "/fa/profile/reservations";
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.set(sessionCookie.name, signedCookie, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookie.secure,
    maxAge: 86400,
  });
  return res;
}