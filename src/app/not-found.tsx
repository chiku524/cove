import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
        <h1 className="font-heading text-4xl">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          That route is not part of Cove. Head back to the dashboard or the
          integration docs.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs">Docs</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
