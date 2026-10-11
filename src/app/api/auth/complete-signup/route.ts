import { NextResponse } from "next/server";
import { ensureAcademyProfile } from "@/lib/registerProfile";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json(
      { error: "Confirm the email for this signup before continuing." },
      { status: 409 },
    );
  }

  const authUser = (await supabase.auth.getUser()).data.user;
  if (
    !authUser?.email_confirmed_at ||
    (email && authUser.email?.toLowerCase() !== email)
  ) {
    return NextResponse.json(
      { error: "Confirm the email for this signup before continuing." },
      { status: 409 },
    );
  }

  const result = await ensureAcademyProfile(supabase);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    role: result.user.role,
    name: `${result.user.firstName} ${result.user.lastName}`,
  });
}
