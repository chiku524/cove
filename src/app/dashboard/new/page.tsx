import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateBotForm } from "@/components/create-bot-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/session";
import { getWorkspaceUsage } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewBotPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard/new");
  const usage = await getWorkspaceUsage(user.id);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
        <div>
          <Link
            href="/dashboard"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← Bots
          </Link>
          <h1 className="font-heading mt-3 text-4xl">Create a support bot</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Give it a name customers will see. You can add knowledge and an API
            key next.
          </p>
        </div>
        {usage.bots >= usage.plan.bots ? (
          <p className="text-sm">
            {usage.plan.name} includes {usage.plan.bots} bot
            {usage.plan.bots === 1 ? "" : "s"}.{" "}
            <Link href="/dashboard/billing" className="underline">
              Upgrade to Pro
            </Link>{" "}
            to add more.
          </p>
        ) : (
          <CreateBotForm />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
