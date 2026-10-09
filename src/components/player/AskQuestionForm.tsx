"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { withConfirmed } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "@/components/feedback/ConfirmDialog";

export function AskQuestionForm({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("Write a question first.");
      return;
    }
    confirm.request();
  }

  async function handleConfirm() {
    await confirm.run(async () => {
      try {
        const response = await fetch(`/api/learning/${courseId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "The question could not be sent.");
          return;
        }
        setContent("");
        router.push(
          withConfirmed(`/student/learning/${courseId}`, "question-sent"),
        );
        router.refresh();
      } catch {
        setError("The question could not be sent. Check your connection.");
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="label" htmlFor="course-question">
          Question
        </label>
        <textarea
          id="course-question"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          className="field"
          style={{ minHeight: "6rem" }}
          placeholder="Ask about a lesson in this course"
          maxLength={2000}
          required
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={confirm.busy}
          className="btn btn-secondary"
        >
          {confirm.busy ? "Sending…" : "Send question"}
        </button>
      </form>
      <ConfirmDialog
        open={confirm.open}
        title="Send this question?"
        description={`${courseTitle}. The assistant answers from this course’s lesson text.`}
        confirmLabel="Send question"
        busy={confirm.busy}
        onConfirm={handleConfirm}
        onCancel={confirm.cancel}
      />
    </>
  );
}
