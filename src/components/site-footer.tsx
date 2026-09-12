import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>Cove — support bots for API, SDK, and MCP.</p>
        <div className="flex gap-4">
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
