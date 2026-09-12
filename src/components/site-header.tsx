import Link from "next/link";
import { HeaderAuth } from "@/components/header-auth";
import { MobileNav } from "@/components/mobile-nav";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const headerUser = user
    ? { name: user.name, email: user.email, plan: user.plan }
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
            C
          </span>
          <span>Cove</span>
        </Link>
        <HeaderAuth user={headerUser} />
        <MobileNav user={headerUser} />
      </div>
    </header>
  );
}
