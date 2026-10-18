import type { Metadata } from "next";
import Link from "next/link";

import { requestPasswordReset } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage, SubmitButton } from "@/components/auth/form-elements";
import { inputClassName } from "@/components/auth/styles";

export const metadata: Metadata = { title: "Reset password" };
export const instant = false;

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Let’s get you back in."
      description="Enter your SDSU email and we’ll send a secure link for choosing a new password."
      footer={
        <Link
          className="font-semibold text-foreground hover:underline"
          href="/auth/login"
        >
          Return to sign in
        </Link>
      }
    >
      <FormMessage error={error} message={message} />
      <form action={requestPasswordReset} className="space-y-5">
        <label className="block text-sm font-semibold">
          SDSU email
          <input
            className={inputClassName}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@sdsu.edu"
            required
          />
        </label>
        <SubmitButton>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
