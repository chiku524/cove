"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

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
          <Button asChild className="justify-start">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
