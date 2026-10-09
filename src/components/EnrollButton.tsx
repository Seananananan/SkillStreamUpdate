"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { withConfirmed, type ConfirmationKey } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";
import type { CourseAccessState } from "@/lib/access";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  enrolled: boolean;
  accessState?: CourseAccessState;
}

export function EnrollButton({
  courseId,
  courseTitle,
  enrolled,
  accessState = "ready",
}: EnrollButtonProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [error, setError] = useState("");

  async function handleEnroll() {
    setError("");
    await confirm.run(async () => {
      try {
        const response = await fetch("/api/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });

        const data = (await response.json()) as {
          error?: string;
          lmsAccount?: { syncStatus?: string };
        };

        if (!response.ok) {
          setError(data.error ?? "Enrollment could not be completed.");
          return;
        }

        const confirmation: ConfirmationKey =
          data.lmsAccount?.syncStatus === "failed"
            ? "access-failed"
            : data.lmsAccount?.syncStatus === "pending"
              ? "access-pending"
              : "enrolled";

        router.push(withConfirmed(`/student/learning/${courseId}`, confirmation));
        router.refresh();
      } catch {
        setError("Enrollment could not be completed. Check your connection.");
      }
    });
  }

  if (enrolled) {
    const accessHint =
      accessState === "failed"
        ? "Course access did not provision."
        : accessState === "pending"
          ? "Setting up course access."
          : "Access is ready.";

    return (
      <div className="sm:text-right">
        <Link href={`/student/learning/${courseId}`} className="btn btn-secondary w-full">
          Open course
        </Link>
        <p className="mt-1.5 text-xs text-muted">{accessHint}</p>
      </div>
    );
  }

  return (
    <div className="sm:text-right">
      <button
        type="button"
        onClick={confirm.request}
        disabled={confirm.busy}
        className="btn btn-primary w-full"
      >
        {confirm.busy ? (
          <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
        ) : null}
        {confirm.busy ? "Enrolling…" : "Enroll"}
      </button>
      <p className="mt-1.5 text-xs text-muted">
        Free. Confirming sets up course access.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Enroll in this course?"
        description={`${courseTitle} is free. Confirming sets up course access.`}
        confirmLabel="Confirm enrollment"
        busy={confirm.busy}
        onConfirm={handleEnroll}
        onCancel={confirm.cancel}
      />
    </div>
  );
}
