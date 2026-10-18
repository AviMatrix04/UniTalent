"use server";

import { redirect } from "next/navigation";

import {
  isSdsuEmail,
  normalizeEmail,
  safeRedirectPath,
  validatePassword,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

function withMessage(path: string, kind: "error" | "message", message: string) {
  const query = new URLSearchParams({ [kind]: message });
  redirect(`${path}?${query.toString()}`);
}

function appUrl(path: string) {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${origin}${path}`;
}

export async function signUp(formData: FormData) {
  const fullName = value(formData, "fullName").trim();
  const email = normalizeEmail(value(formData, "email"));
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");

  if (fullName.length < 2 || fullName.length > 80) {
    withMessage(
      "/auth/sign-up",
      "error",
      "Enter a name between 2 and 80 characters.",
    );
  }

  if (!isSdsuEmail(email)) {
    withMessage(
      "/auth/sign-up",
      "error",
      "Use your @sdsu.edu email address to create an account.",
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    withMessage("/auth/sign-up", "error", passwordError);
  }

  if (password !== confirmPassword) {
    withMessage("/auth/sign-up", "error", "The passwords do not match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: appUrl("/auth/confirm?next=/dashboard"),
    },
  });

  if (error) {
    withMessage(
      "/auth/sign-up",
      "error",
      error.code === "over_email_send_rate_limit"
        ? "Too many confirmation emails were requested. Try again later."
        : "We could not create the account. Please try again.",
    );
  }

  const query = new URLSearchParams({ email });
  redirect(`/auth/check-email?${query.toString()}`);
}

export async function logIn(formData: FormData) {
  const email = normalizeEmail(value(formData, "email"));
  const password = value(formData, "password");
  const next = safeRedirectPath(value(formData, "next"));

  if (!isSdsuEmail(email) || !password) {
    const query = new URLSearchParams({
      next,
      error: "Enter your SDSU email and password.",
    });
    redirect(`/auth/login?${query.toString()}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const query = new URLSearchParams({
      next,
      error:
        error.code === "email_not_confirmed"
          ? "Confirm your SDSU email before signing in."
          : "The email or password is incorrect.",
    });
    redirect(`/auth/login?${query.toString()}`);
  }

  redirect(next);
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login?message=You+have+been+signed+out.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = normalizeEmail(value(formData, "email"));

  if (!isSdsuEmail(email)) {
    withMessage(
      "/auth/forgot-password",
      "error",
      "Enter your @sdsu.edu email address.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl("/auth/confirm?next=/auth/update-password"),
  });

  if (error?.code === "over_email_send_rate_limit") {
    withMessage(
      "/auth/forgot-password",
      "error",
      "Too many reset emails were requested. Try again later.",
    );
  }

  if (error) {
    withMessage(
      "/auth/forgot-password",
      "error",
      "We could not send the reset email. Please try again.",
    );
  }

  withMessage(
    "/auth/forgot-password",
    "message",
    "If an account exists for that address, a reset link is on its way.",
  );
}

export async function updatePassword(formData: FormData) {
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  const passwordError = validatePassword(password);

  if (passwordError) {
    withMessage("/auth/update-password", "error", passwordError);
  }

  if (password !== confirmPassword) {
    withMessage(
      "/auth/update-password",
      "error",
      "The passwords do not match.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    withMessage(
      "/auth/update-password",
      "error",
      "The password could not be updated. Request a new reset link.",
    );
  }

  await supabase.auth.signOut();
  redirect("/auth/login?message=Password+updated.+Sign+in+to+continue.");
}
