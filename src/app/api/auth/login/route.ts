import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db";
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
    portal?: string;
    role?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json(
      { error: supabaseAuthMessage(error ?? new Error("Invalid email or password.")) },
      { status: 401 },
    );
  }

  let user;
  try {
    user = await getUserById(data.user.id);
  } catch (lookupError) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: lookupError instanceof Error ? lookupError.message : "Could not load the academy profile." },
      { status: 500 },
    );
  }
  if (!user && (body.role === "student" || body.role === "instructor")) {
    const registered = await ensureAcademyProfile(supabase, { role: body.role });
    if ("error" in registered) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: registered.error }, { status: 409 });
    }
    user = registered.user;
  }

  if (!user) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "No academy account for this email. Create an account first." },
      { status: 404 },
    );
  }

  if (body.portal === "admin" && user.role !== "admin") {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error:
          "This page is for admin accounts. Sign in as a student or instructor instead.",
      },
      { status: 403 },
    );
  }

  if (
    (body.role === "student" || body.role === "instructor") &&
    user.role !== body.role
  ) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error: `This page is for ${body.role} accounts. Use the ${user.role} sign-in page for this account.`,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
  });
}
