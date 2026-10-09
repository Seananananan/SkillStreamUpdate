"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/feedback/ConfirmDialog";
import { PublicShell } from "@/components/landing/PublicShell";
import { supabaseAuthMessage } from "@/lib/auth-errors";
import { withConfirmed } from "@/lib/confirmations";
import { roleHomePath } from "@/lib/roleHome";
import { activateThisTab } from "@/lib/singleActiveTab";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/types";

export function ResetPasswordForm({ email }: { email: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirmDialog();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (email) {
      activateThisTab();
    }
  }, [email]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    confirm.request();
  }

  async function handleConfirm() {
    await confirm.run(async () => {
      if (!isSupabaseConfigured()) {
        setError("Supabase is not configured. Add the project keys to .env.");
        return;
      }

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, confirmPassword }),
        });
        const data = (await response.json()) as {
          error?: string;
          role?: UserRole | null;
        };
        if (!response.ok) {
          setError(data.error ?? "Could not update the password. Try again.");
          return;
        }

        const destination =
          data.role === "student" ||
          data.role === "instructor" ||
          data.role === "admin"
            ? roleHomePath(data.role)
            : "/login";
        router.push(withConfirmed(destination, "password-updated"));
        router.refresh();
      } catch (caught) {
        setError(supabaseAuthMessage(caught));
      }
    });
  }

  if (!email) {
    const expired = searchParams.get("error") === "invalid";
    return (
      <PublicShell active="login">
        <main
          id="main-content"
          className="flex flex-1 items-center justify-center px-5 py-12"
        >
          <div className="card w-full max-w-md px-6 py-8 text-center">
            <p className="text-sm font-semibold text-brand">SkillStream Academy</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Reset link expired
            </h1>
            <p role="alert" className="mt-3 text-sm leading-6 text-danger">
              {expired
                ? "This reset link is invalid or has expired. Request a new one from the same browser you will use to open it."
                : "Open the reset link from your email in this browser, or request a new one."}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login/forgot" className="btn btn-primary">
                Request a new link
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Return to sign in
              </Link>
            </div>
          </div>
        </main>
      </PublicShell>
    );
  }

  return (
    <PublicShell active="login">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-5 py-8 sm:px-7"
      >
        <div className="my-auto w-full max-w-[26rem]">
          <p className="text-center text-sm font-semibold text-brand">
            SkillStream Academy
          </p>
          <h1 className="mt-1 text-center text-[1.65rem] font-semibold leading-normal tracking-tight">
            Choose a new password
          </h1>
          <p className="mt-3 text-center text-sm text-muted">
            For <span className="font-medium text-ink">{email}</span>
          </p>

          <form
            onSubmit={handleSubmit}
            className="card mt-8 space-y-5 px-5 py-6 sm:px-6"
          >
            <div>
              <label className="label" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field mt-1.5"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="hint mt-1.5">At least 8 characters.</p>
            </div>

            <div>
              <label className="label" htmlFor="confirm-password">
                Re-enter password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="field mt-1.5"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Show passwords
            </label>

            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={confirm.busy}
              className="btn btn-primary w-full"
            >
              {confirm.busy ? "Updating password…" : "Update password"}
            </button>
          </form>
        </div>
      </main>

      <ConfirmDialog
        open={confirm.open}
        title="Update this password?"
        description={`${email} will use this password the next time you sign in.`}
        confirmLabel="Update password"
        busy={confirm.busy}
        onConfirm={handleConfirm}
        onCancel={confirm.cancel}
      />
    </PublicShell>
  );
}
