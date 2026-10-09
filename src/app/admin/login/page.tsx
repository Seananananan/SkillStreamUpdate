import { Suspense } from "react";
import { AccountForm } from "@/components/auth/AccountForm";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <AccountForm role="admin" allowSignup={false} />
    </Suspense>
  );
}