import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isSdsuEmail } from "@/lib/auth/validation";

const protectedPrefixes = [
  "/dashboard",
  "/explore",
  "/offer",
  "/profile",
  "/services",
  "/reports",
];

function copiesSessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/auth/update-password" ||
    protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const email = typeof claims?.email === "string" ? claims.email : "";
  const hasStudentSession = Boolean(claims?.sub && isSdsuEmail(email));
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !hasStudentSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return copiesSessionCookies(response, NextResponse.redirect(loginUrl));
  }

  if (
    hasStudentSession &&
    (pathname === "/auth/login" || pathname === "/auth/sign-up")
  ) {
    return copiesSessionCookies(
      response,
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  return response;
}
