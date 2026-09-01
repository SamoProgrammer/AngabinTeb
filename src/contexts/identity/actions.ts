"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { providers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

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

export async function requireProvider() {
  const user = await requireUser();
  if (user.role !== "provider") redirect("/");
  const [row] = await db.select().from(providers).where(eq(providers.phone, user.phoneNumber ?? ""));
  if (!row) return redirect("/provider-claim");
  return { user, providerRow: row };
}