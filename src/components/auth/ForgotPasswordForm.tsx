"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/feedback/ConfirmDialog";
import { PublicShell } from "@/components/landing/PublicShell";
import { supabaseAuthMessage } from "@/lib/auth-errors";
import { loginPathForRole } from "@/lib/roleHome";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const passwordResetEmailKey = "password-reset-email";

function subscribeToPasswordResetEmail() {
  return () => {};
}

function getSavedPasswordResetEmail() {
  return window.sessionStorage.getItem(passwordResetEmailKey) ?? "";
}

function signInPath(from: string | null) {
  if (from === "student" || from === "instructor" || from === "admin") {
    return loginPathForRole(from);
  }
  return "/login";
}

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const confirm = useConfirmDialog();
  const backHref = signInPath(searchParams.get("from"));
  const savedEmail = useSyncExternalStore(
    subscribeToPasswordResetEmail,
    getSavedPasswordResetEmail,
    () => "",
  );
  const [editedEmail, setEditedEmail] = useState<string | null>(null);
  const email = editedEmail ?? savedEmail;
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    confirm.request();
  }

  async function handleConfirm() {
    await confirm.run(async () => {
      if (!isSupabaseConfigured()) {
        setError("Supabase is not configured. Add the project keys to .env.");
        return;
      }

      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "Could not send the reset email. Try again.");
          return;
        }
        setSent(true);
      } catch (caught) {
        setError(supabaseAuthMessage(caught));
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
          <p className="text-center text-sm font-semibold text-brand">
            SkillStream Academy
          </p>
          <h1 className="mt-1 text-center text-[1.65rem] font-semibold leading-normal tracking-tight">
            Reset password
          </h1>
          <p className="mt-3 text-center text-sm text-muted">
            <Link href={backHref} className="font-medium text-brand hover:text-brand-strong">
              Back to sign in
            </Link>
          </p>

          <form
            onSubmit={handleSubmit}
            className="card mt-8 space-y-5 px-5 py-6 sm:px-6"
          >
            <p className="text-sm leading-6 text-muted">
              Enter the email on your account. A reset link will be sent if that
              account exists. Open the link in this same browser.
            </p>

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEditedEmail(event.target.value);
                  setSent(false);
                }}
                className="field mt-1.5"
                autoComplete="email"
                required
              />
            </div>

            {sent ? (
              <p role="status" className="text-sm leading-6 text-ink">
                If an account exists for that email, a reset link is on its way.
                Open it in this browser.
              </p>
            ) : null}

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
              {confirm.busy ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>
        </div>
      </main>

      <ConfirmDialog
        open={confirm.open}
        title="Send a password reset link?"
        description={`${email || "This email"} will receive the link if an account exists.`}
        confirmLabel="Send reset link"
        busy={confirm.busy}
        onConfirm={handleConfirm}
        onCancel={confirm.cancel}
      />
    </PublicShell>
  );
}
