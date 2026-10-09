import { Suspense } from "react";
import { AccountForm } from "@/components/auth/AccountForm";

export default function InstructorLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <AccountForm role="instructor" allowSignup />
    </Suspense>
  );
}
