import { NextResponse } from "next/server";
import { supabaseAuthMessage } from "@/lib/auth-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Add the project keys to .env." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/auth/recover", request.url).toString(),
  });

  if (error && error.code !== "user_not_found") {
    const status =
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"
        ? 429
        : 400;
    return NextResponse.json({ error: supabaseAuthMessage(error) }, { status });
  }

  return NextResponse.json({ ok: true });
}
