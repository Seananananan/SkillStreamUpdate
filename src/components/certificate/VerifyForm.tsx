"use client";

import { FormEvent, useState } from "react";
import { lookupCertificate } from "@/app/verify/actions";
import { ConfirmDialog, useConfirmDialog } from "@/components/feedback/ConfirmDialog";

export function VerifyForm({
  defaultValue = "",
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  const confirm = useConfirmDialog();
  const [reference, setReference] = useState(defaultValue);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    confirm.request();
  }

  async function handleVerify() {
    await confirm.run(async () => {
      const formData = new FormData();
      formData.set("ref", reference);
      await lookupCertificate(formData);
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="ref">
              Certificate reference
            </label>
            <input
              id="ref"
              name="ref"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="field mt-1.5 font-mono"
              placeholder="SSA-2026-XXXXXX"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <button
            type="submit"
            disabled={confirm.busy}
            className="btn btn-primary sm:shrink-0"
          >
            {confirm.busy ? "Checking…" : "Verify"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>

      <ConfirmDialog
        open={confirm.open}
        title="Look up this certificate?"
        description={`The registry will be checked for ${reference.trim() || "this reference"}. You do not need an account.`}
        confirmLabel="Verify reference"
        busy={confirm.busy}
        onConfirm={handleVerify}
        onCancel={confirm.cancel}
      />
    </>
  );
}
