"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { withConfirmed } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

export function AdminReviewForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const approveConfirm = useConfirmDialog();
  const returnConfirm = useConfirmDialog();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const busy = approveConfirm.busy || returnConfirm.busy;

  async function decide(action: "approve" | "return") {
    setError("");
    const dialog = action === "approve" ? approveConfirm : returnConfirm;
    await dialog.run(async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            feedback: action === "return" ? feedback : undefined,
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "The review could not be saved.");
          return;
        }
        setFeedback("");
        router.push(
          withConfirmed(
            "/admin/courses",
            action === "approve" ? "published" : "sent-back",
          ),
        );
      } catch {
        setError("The review could not be saved. Check your connection.");
      }
    });
  }

  function requestReturn() {
    if (!feedback.trim()) {
      setError("Write feedback before sending the course back.");
      return;
    }
    setError("");
    returnConfirm.request();
  }

  return (
    <section aria-labelledby="decision-title" className="card p-5">
      <h2 id="decision-title" className="section-title">
        Decision
      </h2>
      <p className="mt-1 text-sm text-muted">
        Approve publishes the course. Sending it back keeps it a draft and
        shows your note to the instructor.
      </p>
      <label className="label mt-4" htmlFor="review-feedback">
        Feedback
      </label>
      <textarea
        id="review-feedback"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        rows={4}
        maxLength={1000}
        className="field mt-1.5 resize-y"
        placeholder="What should the instructor change?"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={approveConfirm.request}
        >
          {approveConfirm.busy ? (
            <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
          ) : null}
          {approveConfirm.busy ? "Publishing…" : "Approve and publish"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={requestReturn}
        >
          {returnConfirm.busy ? (
            <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
          ) : null}
          {returnConfirm.busy ? "Sending…" : "Send back"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={approveConfirm.open}
        title="Publish this course?"
        description="Students will see it in the catalog and can enroll."
        confirmLabel="Publish"
        busy={approveConfirm.busy}
        onConfirm={() => decide("approve")}
        onCancel={approveConfirm.cancel}
      />
      <ConfirmDialog
        open={returnConfirm.open}
        title="Send this course back?"
        description="It stays a draft. The instructor will see the feedback you wrote."
        confirmLabel="Send back"
        tone="danger"
        busy={returnConfirm.busy}
        onConfirm={() => decide("return")}
        onCancel={returnConfirm.cancel}
      />
    </section>
  );
}
