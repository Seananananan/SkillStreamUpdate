"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PublicShell } from "@/components/landing/PublicShell";
import { activateThisTab } from "@/lib/singleActiveTab";

export function AuthReturn({
  confirmed,
  dashboardPath,
}: {
  confirmed: boolean;
  dashboardPath: string;
}) {
  useEffect(() => {
    if (confirmed) {
      activateThisTab();
    }
  }, [confirmed]);

  return (
    <PublicShell active="login">
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-5 py-12"
      >
        <div className="card w-full max-w-md px-6 py-8 text-center">
          <p className="text-sm font-semibold text-brand">SkillStream Academy</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {confirmed ? "Email confirmed" : "Confirmation problem"}
          </h1>
          <p
            role={confirmed ? "status" : "alert"}
            className={`mt-3 text-sm leading-6 ${
              confirmed ? "text-muted" : "text-danger"
            }`}
          >
            {confirmed
              ? "Your account is ready. Continue to your SkillStream dashboard."
              : "This confirmation link is invalid or has expired. Return to SkillStream and try again."}
          </p>
          <Link
            href={confirmed ? dashboardPath : "/login"}
            className="btn btn-secondary mt-6"
          >
            {confirmed ? "Continue to dashboard" : "Return to SkillStream"}
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}
