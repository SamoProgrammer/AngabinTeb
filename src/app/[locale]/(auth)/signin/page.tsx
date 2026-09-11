import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signedInTarget } from "@/contexts/identity/return";
import { SignInSuspense } from "./signin-form";

interface SignInPageProps {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams:
    | Promise<{ returnUrl?: string; callbackUrl?: string }>
    | { returnUrl?: string; callbackUrl?: string };
}

// Logged-in users never see the form: bounce to where a fresh login
// would land them (validated returnUrl, else role-aware default).
export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const resolvedParams = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const raw = resolvedSearch.returnUrl || resolvedSearch.callbackUrl;
    redirect(
      signedInTarget((session.user as { role?: string }).role, raw, resolvedParams.locale),
    );
  }
  return <SignInSuspense locale={resolvedParams.locale} />;
}
