import type { Metadata } from "next";

import { updatePassword } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage, SubmitButton } from "@/components/auth/form-elements";
import { inputClassName } from "@/components/auth/styles";

export const metadata: Metadata = { title: "Choose a new password" };
export const instant = false;

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Secure your account"
      title="Choose a new password."
      description="Use a password you have not used for this account before. You’ll sign in again after it is updated."
    >
      <FormMessage error={error} />
      <form action={updatePassword} className="space-y-5">
        <label className="block text-sm font-semibold">
          New password
          <input
            className={inputClassName}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Confirm new password
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
        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
