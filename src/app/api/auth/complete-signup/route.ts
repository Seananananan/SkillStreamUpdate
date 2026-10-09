import { NextResponse } from "next/server";
import { ensureAcademyProfile } from "@/lib/registerProfile";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const result = await ensureAcademyProfile(supabase);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    role: result.user.role,
    name: `${result.user.firstName} ${result.user.lastName}`,
  });
}
