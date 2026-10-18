import type { Metadata } from "next";
import Link from "next/link";

import { signUp } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage, SubmitButton } from "@/components/auth/form-elements";
import { inputClassName } from "@/components/auth/styles";

export const metadata: Metadata = { title: "Create account" };
export const instant = false;

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Join the directory"
      title="Start with your student email."
      description="Create an account using your SDSU email. We will send a one-time confirmation link before you can enter the student directory."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            className="font-semibold text-foreground hover:underline"
            href="/auth/login"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <FormMessage error={error} />
      <form action={signUp} className="space-y-5">
        <label className="block text-sm font-semibold">
          Full name
          <input
            className={inputClassName}
            name="fullName"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            placeholder="Your name"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          SDSU email
          <input
            className={inputClassName}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@sdsu.edu"
            pattern="[^@\s]+@sdsu\.edu"
            title="Use your @sdsu.edu email address"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            className={inputClassName}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            Use at least 8 characters.
          </span>
        </label>
        <label className="block text-sm font-semibold">
          Confirm password
          <input
            className={inputClassName}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        <SubmitButton>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}
