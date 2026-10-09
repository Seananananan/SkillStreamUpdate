import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleHomePath } from "@/lib/roleHome";
import type { UserRole } from "@/lib/types";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./env";

function roleFromClaims(claims: unknown): UserRole | null {
  if (!claims || typeof claims !== "object") return null;
  const meta = (claims as { app_metadata?: { role?: unknown } }).app_metadata;
  const role = meta?.role;
  if (role === "student" || role === "instructor" || role === "admin") {
    return role;
  }
  return null;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return supabaseResponse;

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const role = roleFromClaims(data?.claims);

  const { pathname } = request.nextUrl;
  const PUBLIC_PATHS = ["/", "/login"];
  if (
    pathname === "/admin/login" ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next")
  ) {
    return supabaseResponse;
  }

  const requiredRole: UserRole | null = pathname.startsWith("/student")
    ? "student"
    : pathname.startsWith("/instructor")
      ? "instructor"
      : pathname.startsWith("/admin")
        ? "admin"
        : null;

  if (!requiredRole) return supabaseResponse;

  if (!role) {
    const loginUrl = new URL(
      requiredRole === "admin" ? "/admin/login" : "/login",
      request.url,
    );
    loginUrl.searchParams.set("next", pathname);
    return copyCookies(supabaseResponse, NextResponse.redirect(loginUrl));
  }

  if (role !== requiredRole) {
    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(new URL(roleHomePath(role), request.url)),
    );
  }

  return supabaseResponse;
}
