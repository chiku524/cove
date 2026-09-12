"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { navigate } from "@/lib/nav";

export type HeaderUser = {
  name: string;
  email: string;
  plan: string;
};

export function HeaderAuth({ user }: { user: HeaderUser | null }) {
  if (!user) {
    return (
      <div className="hidden items-center gap-1 sm:flex">
        <Button asChild variant="ghost" size="sm">
          <Link href="/docs">Docs</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Start free</Link>
        </Button>
      </div>
    );
  }

  async function signOut() {
    await authClient.signOut();
    navigate("/");
  }

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/docs">Docs</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {user.name.split(" ")[0] || user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            <p className="text-muted-foreground mt-1 text-xs capitalize">
              {user.plan} plan
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/billing">Billing</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
