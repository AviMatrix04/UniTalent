import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Check your email" };
export const instant = false;

type CheckEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const { email } = await searchParams;

  return (
    <AuthShell
      eyebrow="One quick check"
      title="Open your SDSU inbox."
      description="We sent a confirmation link to verify that you control the university email used for registration."
      footer={
        <p>
          Already confirmed?{" "}
          <Link
            className="font-semibold text-foreground hover:underline"
            href="/auth/login"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
          <MailCheck aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-5 font-semibold">Confirmation email sent</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {email ? (
            <>
              Follow the link sent to{" "}
              <strong className="text-foreground">{email}</strong>.
            </>
          ) : (
            "Follow the link in your email to finish creating your account."
          )}{" "}
          The link can be used only once.
        </p>
      </div>
    </AuthShell>
  );
}
