"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { withConfirmed } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

export function RevokeCertificateButton({
  courseId,
  enrollmentId,
  referenceNumber,
}: {
  courseId: string;
  enrollmentId: string;
  referenceNumber: string;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [error, setError] = useState("");

  async function handleRevoke() {
    setError("");
    await confirm.run(async () => {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/enrollments/${enrollmentId}/certificate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verificationStatus: "revoked" }),
          },
        );
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(data.error ?? "The certificate could not be revoked.");
          return;
        }

        router.push(
          withConfirmed(
            `/instructor/courses/${courseId}/roster/${enrollmentId}`,
            "revoked",
          ),
        );
        router.refresh();
      } catch {
        setError("The certificate could not be revoked. Check your connection.");
      }
    });
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={confirm.request}
        disabled={confirm.busy}
        className="btn btn-quiet text-danger hover:text-danger"
      >
        {confirm.busy ? (
          <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
        ) : null}
        {confirm.busy ? "Revoking…" : "Revoke certificate"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Revoke this certificate?"
        description={`${referenceNumber} stays in the registry. Public verify will show it as revoked. This cannot be undone.`}
        confirmLabel="Revoke certificate"
        tone="danger"
        busy={confirm.busy}
        onConfirm={handleRevoke}
        onCancel={confirm.cancel}
      />
    </div>
  );
}
