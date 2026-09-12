"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import type { HeaderUser } from "@/components/header-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { navigate } from "@/lib/nav";

export function MobileNav({ user }: { user: HeaderUser | null }) {
  const [open, setOpen] = useState(false);

  async function signOut() {
    setOpen(false);
    await authClient.signOut();
    navigate("/");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Cove</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 px-4">
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/" onClick={() => setOpen(false)}>
              Home
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/docs" onClick={() => setOpen(false)}>
              Docs
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/dashboard/billing" onClick={() => setOpen(false)}>
                  Billing
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/sign-in" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild className="justify-start">
                <Link href="/sign-up" onClick={() => setOpen(false)}>
                  Start free
                </Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
