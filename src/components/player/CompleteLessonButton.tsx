"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { withConfirmed } from "@/lib/confirmations";
import { completeActionLabel } from "@/lib/player";
import { ConfirmDialog, useConfirmDialog } from "../feedback/ConfirmDialog";

interface CompleteLessonButtonProps {
  courseId: string;
  lesson: Lesson;
  completed: boolean;
  nextLessonId: string | null;
  finishesCourse: boolean;
}

export function CompleteLessonButton({
  courseId,
  lesson,
  completed,
  nextLessonId,
  finishesCourse,
}: CompleteLessonButtonProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [error, setError] = useState("");

  const courseHref = `/student/learning/${courseId}`;
  const nextHref = nextLessonId
    ? `/student/learning/${courseId}/lessons/${nextLessonId}`
    : courseHref;
  const actionLabel = completeActionLabel(lesson.contentType);

  function selectedQuizChoice() {
    if (lesson.contentType !== "quiz") return undefined;
    const selected = document.querySelector<HTMLInputElement>(
      `input[name="quiz-${lesson.id}"]:checked`,
    );
    if (!selected) return null;
    const choiceIndex = Number(selected.value);
    return Number.isInteger(choiceIndex) ? choiceIndex : null;
  }

  function handleRequest() {
    if (lesson.contentType === "quiz" && selectedQuizChoice() == null) {
      setError("Choose an answer first.");
      return;
    }
    setError("");
    confirm.request();
  }

  async function handleComplete() {
    setError("");
    const choiceIndex = selectedQuizChoice();
    if (lesson.contentType === "quiz" && choiceIndex == null) {
      setError("Choose an answer first.");
      return;
    }
    await confirm.run(async () => {
      try {
        const response = await fetch(
          `/api/learning/${courseId}/lessons/${lesson.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "completed",
              choiceIndex: lesson.contentType === "quiz" ? choiceIndex : undefined,
            }),
          },
        );
        const data = (await response.json()) as {
          error?: string;
          nextLesson?: { id: string } | null;
          certificate?: { id: string } | null;
          justCertified?: boolean;
        };

        if (!response.ok) {
          setError(data.error ?? "This lesson could not be completed.");
          return;
        }

        if (data.justCertified && data.certificate?.id) {
          router.push(
            withConfirmed(
              `/student/certificates/${data.certificate.id}`,
              "certified",
            ),
          );
        } else {
          const destination = data.nextLesson
            ? `/student/learning/${courseId}/lessons/${data.nextLesson.id}`
            : courseHref;
          router.push(withConfirmed(destination, "lesson-complete"));
        }
        router.refresh();
      } catch {
        setError("This lesson could not be completed. Check your connection.");
      }
    });
  }

  if (completed) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-success">Lesson complete</p>
        <Link href={nextHref} className="btn btn-primary">
          {nextLessonId ? "Next lesson" : "Back to course"}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={confirm.busy}
        className="btn btn-primary"
      >
        {confirm.busy ? (
          <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
        ) : null}
        {confirm.busy ? "Saving…" : actionLabel}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title={finishesCourse ? "Finish the course?" : "Mark this lesson complete?"}
        description={
          lesson.contentType === "quiz"
            ? "The lesson is marked complete only if this answer is right."
            : finishesCourse
              ? `${lesson.title} is the last lesson. Confirming issues your certificate.`
              : `${lesson.title} will be saved as complete. You can still reopen it afterwards.`
        }
        confirmLabel={finishesCourse ? "Complete and certify" : actionLabel}
        busy={confirm.busy}
        onConfirm={handleComplete}
        onCancel={confirm.cancel}
      />
    </div>
  );
}
