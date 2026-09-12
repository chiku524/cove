import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
            C
          </span>
          <span>Cove</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">Docs</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
