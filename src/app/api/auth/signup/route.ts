import { NextResponse } from "next/server";
import { supabaseAuthMessage } from "@/lib/auth-errors";
import { ensureAcademyProfile } from "@/lib/registerProfile";
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
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };

  if (body.role !== "student" && body.role !== "instructor") {
    return NextResponse.json(
      { error: "Choose a student or instructor account." },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== body.confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: signedUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", request.url).toString(),
      data: { first_name: firstName, last_name: lastName, role: body.role },
    },
  });

  if (signUpError) {
    const already =
      signUpError.message.toLowerCase().includes("already") ||
      signUpError.code === "user_already_exists";
    if (already) {
      return NextResponse.json(
        { error: "This email is already used. Sign in instead." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: supabaseAuthMessage(signUpError) }, { status: 400 });
  }

  if (signedUp.user?.identities?.length === 0) {
    return NextResponse.json(
      { error: "This email is already used. Sign in instead." },
      { status: 409 },
    );
  }

  if (!signedUp.session) {
    return NextResponse.json({ confirmationRequired: true });
  }

  const registered = await ensureAcademyProfile(supabase, {
    firstName,
    lastName,
    role: body.role,
  });
  if ("error" in registered) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: registered.error }, { status: 409 });
  }

  return NextResponse.json({
    role: registered.user.role,
    name: `${registered.user.firstName} ${registered.user.lastName}`,
  });
}
