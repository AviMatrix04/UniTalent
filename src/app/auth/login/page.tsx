import type { Metadata } from "next";
import Link from "next/link";

import { logIn } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage, SubmitButton } from "@/components/auth/form-elements";
import { inputClassName } from "@/components/auth/styles";
import { safeRedirectPath } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Sign in" };
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, next: requestedNext } = await searchParams;
  const next = safeRedirectPath(requestedNext);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to find your people."
      description="The directory is private to verified SDSU students. Use the email and password connected to your account."
      footer={
        <p>
          New to UNI-TALENT?{" "}
          <Link
            className="font-semibold text-foreground hover:underline"
            href="/auth/sign-up"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <FormMessage error={error} message={message} />
      <form action={logIn} className="space-y-5">
        <input name="next" type="hidden" value={next} />
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
        <label className="block text-sm font-semibold">
          <span className="flex items-center justify-between gap-4">
            Password
            <Link
              className="text-xs font-semibold text-accent hover:underline"
              href="/auth/forgot-password"
            >
              Forgot password?
            </Link>
          </span>
          <input
            className={inputClassName}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <SubmitButton>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}
