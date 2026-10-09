import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function resetPage(request: Request, invalid = false) {
  const url = new URL("/login/reset-password", request.url);
  if (invalid) url.searchParams.set("error", "invalid");
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id");
  if (!code) return resetPage(request, true);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );
  if (error) return resetPage(request, true);

  return resetPage(request);
}
