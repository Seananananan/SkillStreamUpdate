import { NextResponse } from "next/server";
import { ensureAcademyProfile } from "@/lib/registerProfile";
import { createClient } from "@/lib/supabase/server";

function confirmationResult(request: Request, status: "success" | "error") {
  return NextResponse.redirect(
    new URL(`/auth/confirmed?status=${status}`, request.url),
  );
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return confirmationResult(request, "error");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return confirmationResult(request, "error");

  const profile = await ensureAcademyProfile(supabase);
  if ("error" in profile) return confirmationResult(request, "error");

  return confirmationResult(request, "success");
}
