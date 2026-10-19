import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { logOut } from "@/app/auth/actions";
import { isSdsuEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : "";

  if (!claims?.sub || !isSdsuEmail(email)) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            className="text-lg font-black tracking-[-0.06em]"
            href="/dashboard"
          >
            UNI<span className="text-accent">-</span>TALENT
          </Link>
          <div className="flex items-center gap-4">
            <nav
              aria-label="Student account"
              className="hidden items-center gap-1 md:flex"
            >
              <Link
                className="rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-muted"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-muted"
                href="/services/new"
              >
                Offer a service
              </Link>
              <Link
                className="rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-muted"
                href="/profile/settings"
              >
                Profile
              </Link>
            </nav>
            <span className="hidden text-sm text-muted-foreground sm:block">
              {email}
            </span>
            <form action={logOut}>
              <button
                type="submit"
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-foreground/30 hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
