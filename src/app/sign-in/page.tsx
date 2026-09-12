import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect(next?.startsWith("/dashboard") ? next : "/dashboard");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
        <div>
          <h1 className="font-heading text-4xl">Sign in</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Open your bots, API keys, and billing.
          </p>
        </div>
        <AuthForm mode="sign-in" nextPath={next} />
      </main>
      <SiteFooter />
    </div>
  );
}
