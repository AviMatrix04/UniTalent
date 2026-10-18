import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { safeRedirectPath } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));
  const supabase = await createClient();
  const callbackError = requestUrl.searchParams.get("error_code");

  if (callbackError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email_confirmed_at) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    const loginUrl = new URL("/auth/login", requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      callbackError === "otp_expired"
        ? "That confirmation link has expired or was already used. Create a new confirmation email and try again."
        : "That email confirmation could not be completed. Request a new link and try again.",
    );
    return NextResponse.redirect(loginUrl);
  }

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  let error: Error | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    }));
  } else {
    error = new Error("Missing confirmation credentials");
  }

  if (!error) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const loginUrl = new URL("/auth/login", requestUrl.origin);
  loginUrl.searchParams.set(
    "error",
    "That email link is invalid or has expired. Request a new one and try again.",
  );
  return NextResponse.redirect(loginUrl);
}
