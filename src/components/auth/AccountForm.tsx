"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PublicShell } from "@/components/landing/PublicShell";
import { ConfirmedBanner } from "@/components/feedback/ConfirmedBanner";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/feedback/ConfirmDialog";
import { withConfirmed } from "@/lib/confirmations";
import { supabaseAuthMessage } from "@/lib/auth-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { destinationAfterAuth } from "@/lib/roleHome";
import { activateThisTab } from "@/lib/singleActiveTab";
import type { UserRole } from "@/lib/types";

const demoAccounts: Record<UserRole, { email: string; password: string }> = {
  student: {
    email: "student@skillstream.academy",
    password: "password123",
  },
  instructor: {
    email: "instructor@skillstream.academy",
    password: "password123",
  },
  admin: {
    email: "admin@skillstream.academy",
    password: "password123",
  },
};

const roleLabels: Record<UserRole, string> = {
  student: "Student",
  instructor: "Instructor",
  admin: "Admin",
};

export function AccountForm({
  role,
  allowSignup,
}: {
  role: UserRole;
  allowSignup: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirmDialog();
  const [mode, setMode] = useState<"sign-in" | "sign-up">(
    searchParams.get("mode") === "signup" ? "sign-up" : "sign-in",
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [confirmedInOtherTab, setConfirmedInOtherTab] = useState(false);

  const label = roleLabels[role];
  const demo = demoAccounts[role];
  const signingUp = allowSignup && mode === "sign-up";

  useEffect(() => {
    if (!waitingForConfirmation) return;

    let checking = false;
    const checkConfirmation = async () => {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch("/api/auth/complete-signup", {
          method: "POST",
        });
        const data = (await response.json()) as {
          role?: UserRole;
        };
        if (!response.ok || !data.role) return;

        setWaitingForConfirmation(false);
        setConfirmedInOtherTab(true);
        setNotice(
          "Email confirmed. Continue in the confirmation tab to open your dashboard. You can close this page.",
        );
      } finally {
        checking = false;
      }
    };

    const interval = window.setInterval(() => {
      void checkConfirmation();
    }, 2000);
    void checkConfirmation();

    return () => window.clearInterval(interval);
  }, [router, waitingForConfirmation]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (signingUp && password !== confirmPassword) {
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
        const trimmedEmail = email.trim();
        const response = await fetch(
          signingUp ? "/api/auth/signup" : "/api/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              signingUp
                ? {
                    email: trimmedEmail,
                    password,
                    confirmPassword,
                    firstName,
                    lastName,
                    role,
                  }
                : {
                    email: trimmedEmail,
                    password,
                    role,
                    portal: role === "admin" ? "admin" : undefined,
                  },
            ),
          },
        );

        const data = (await response.json()) as {
          error?: string;
          role?: UserRole;
          confirmationRequired?: boolean;
        };

        if (data.confirmationRequired || (response.ok && !data.role)) {
          setWaitingForConfirmation(true);
          setNotice(
            "Check your email and confirm your address. Keep this page open—it will update automatically and take you to your dashboard.",
          );
          return;
        }

        if (!response.ok || !data.role) {
          setError(data.error ?? "Could not create the account. Try again.");
          return;
        }

        activateThisTab();
        const destination = destinationAfterAuth(
          data.role,
          searchParams.get("next"),
        );
        router.push(
          withConfirmed(destination, signingUp ? "account-created" : "signed-in"),
        );
        router.refresh();
      } catch (error) {
        setError(supabaseAuthMessage(error));
      }
    });
  }

  return (
    <PublicShell active="login">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-5 py-8 sm:px-7"
      >
        <div className="my-auto w-full max-w-[26rem]">
          <p className="text-center text-sm font-semibold text-brand">{label}</p>
          <h1 className="mt-1 text-center text-[1.65rem] font-semibold leading-normal tracking-tight">
            {signingUp ? "Create account" : "Sign in"}
          </h1>
          {role !== "admin" ? (
            <p className="mt-3 text-center text-sm text-muted">
              <Link href="/login" className="font-medium text-brand hover:text-brand-strong">
                Choose a different role
              </Link>
            </p>
          ) : null}

          <div className="mt-8">
            <ConfirmedBanner />
          </div>

          <form
            onSubmit={handleSubmit}
            className="card space-y-5 px-5 py-6 sm:px-6"
          >
            {signingUp ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="first-name">
                    First name
                  </label>
                  <input
                    id="first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="field mt-1.5"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="last-name">
                    Last name
                  </label>
                  <input
                    id="last-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="field mt-1.5"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field mt-1.5"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label className="label" htmlFor="password">
                  Password
                </label>
                {signingUp ? null : (
                  <Link
                    href={`/login/forgot?from=${role}`}
                    onClick={() => {
                      const trimmedEmail = email.trim();
                      if (trimmedEmail) {
                        window.sessionStorage.setItem(
                          "password-reset-email",
                          trimmedEmail,
                        );
                      }
                    }}
                    className="text-sm font-medium text-brand hover:text-brand-strong"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field mt-1.5"
                autoComplete={signingUp ? "new-password" : "current-password"}
                minLength={signingUp ? 8 : undefined}
                required
              />
              {signingUp ? (
                <p className="hint mt-1.5">At least 8 characters.</p>
              ) : (
                <p className="hint mt-1.5">
                  Demo account:{" "}
                  <code className="font-mono text-ink">{demo.email}</code> /{" "}
                  <code className="font-mono text-ink">{demo.password}</code>
                </p>
              )}
            </div>

            {signingUp ? (
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
            ) : null}

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Show {signingUp ? "passwords" : "password"}
            </label>

            {notice ? (
              <p role="status" className="text-sm text-ink">
                {notice}
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                confirm.busy || waitingForConfirmation || confirmedInOtherTab
              }
              className="btn btn-primary w-full"
            >
              {confirmedInOtherTab
                ? "Email confirmed—continue in the other tab"
                : waitingForConfirmation
                ? "Waiting for email confirmation…"
                : confirm.busy
                ? signingUp
                  ? "Creating account…"
                  : "Signing in…"
                : signingUp
                  ? "Create account"
                  : "Sign in"}
            </button>

            {allowSignup ? (
              <button
                type="button"
                className="w-full text-sm font-medium text-brand hover:text-brand-strong"
                onClick={() => {
                  setMode(signingUp ? "sign-in" : "sign-up");
                  setConfirmPassword("");
                  setShowPassword(false);
                  setWaitingForConfirmation(false);
                  setConfirmedInOtherTab(false);
                  setError("");
                  setNotice("");
                }}
              >
                {signingUp
                  ? "Already have an account? Sign in"
                  : "New here? Create an account"}
              </button>
            ) : null}
          </form>
        </div>
      </main>

      <ConfirmDialog
        open={confirm.open}
        title={
          signingUp
            ? `Create this ${label.toLowerCase()} account?`
            : `Sign in as ${label.toLowerCase()}?`
        }
        description={
          signingUp
            ? `${email || "This email"} will be a ${label.toLowerCase()} account.`
            : `${email || "This email"} will open the matching workspace.`
        }
        confirmLabel={signingUp ? "Create account" : "Sign in"}
        busy={confirm.busy}
        onConfirm={handleConfirm}
        onCancel={confirm.cancel}
      />
    </PublicShell>
  );
}
