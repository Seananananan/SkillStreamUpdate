import { Suspense } from "react";
import { AccountForm } from "@/components/auth/AccountForm";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <AccountForm role="student" allowSignup />
    </Suspense>
  );
}
