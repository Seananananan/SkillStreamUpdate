import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db";
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

  const body = (await request.json()) as {
    password?: string;
    confirmPassword?: string;
  };
  const password = body.password ?? "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (password !== body.confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !data.user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: supabaseAuthMessage(error) }, { status: 400 });
  }

  const user = await getUserById(data.user.id);
  return NextResponse.json({ ok: true, role: user?.role ?? null });
}
