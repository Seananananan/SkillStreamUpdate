import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <ResetPasswordForm email={data.user?.email ?? null} />
    </Suspense>
  );
}
