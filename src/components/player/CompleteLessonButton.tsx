"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { Lesson, QuizAttempt } from "@/lib/types";
import { withConfirmed } from "@/lib/confirmations";
import { parseQuizConfig } from "@/lib/lessonContent";
import { completeActionLabel } from "@/lib/player";
import { ConfirmDialog, useConfirmDialog } from "../feedback/ConfirmDialog";

interface CompleteLessonButtonProps {
  courseId: string;
  lesson: Lesson;
  completed: boolean;
  nextLessonId: string | null;
  finishesCourse: boolean;
  quizAttempt: QuizAttempt | null;
}

export function CompleteLessonButton({
  courseId,
  lesson,
  completed,
  nextLessonId,
  finishesCourse,
  quizAttempt,
}: CompleteLessonButtonProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [quizAttemptStatus, setQuizAttemptStatus] = useState(
    quizAttempt?.status ?? null,
  );

  useEffect(() => {
    if (!quizAttempt || quizAttempt.status !== "in_progress" || !quizAttempt.expiresAt) {
      return;
    }
    const expiresAt = quizAttempt.expiresAt;
    function updateStatus() {
      if (Date.now() >= Date.parse(expiresAt)) {
        setQuizAttemptStatus("timed_out");
      }
    }
    const interval = window.setInterval(updateStatus, 1000);
    return () => window.clearInterval(interval);
  }, [quizAttempt]);

  const courseHref = `/student/learning/${courseId}`;
  const nextHref = nextLessonId
    ? `/student/learning/${courseId}/lessons/${nextLessonId}`
    : courseHref;
  const actionLabel = completeActionLabel(lesson.contentType);
  const attemptClosed =
    lesson.contentType === "quiz" && quizAttemptStatus !== "in_progress";

  function selectedQuizChoices() {
    if (lesson.contentType !== "quiz") return undefined;
    const quiz = parseQuizConfig(lesson.contentRef);
    const choices = quiz.questions.map((_, questionIndex) => {
      const selected = document.querySelector<HTMLInputElement>(
        `input[name="quiz-${lesson.id}-${questionIndex}"]:checked`,
      );
      if (!selected) return null;
      const choiceIndex = Number(selected.value);
      return Number.isInteger(choiceIndex) ? choiceIndex : null;
    });
    return choices.length > 0 && choices.every((choice) => choice != null)
      ? choices
      : null;
  }

  function handleRequest() {
    if (attemptClosed) {
      setError("Start a new attempt before submitting.");
      return;
    }
    if (lesson.contentType === "quiz" && selectedQuizChoices() == null) {
      setError("Answer every question first.");
      return;
    }
    setError("");
    confirm.request();
  }

  async function handleComplete() {
    setError("");
    const choiceIndexes = selectedQuizChoices();
    if (lesson.contentType === "quiz" && choiceIndexes == null) {
      setError("Answer every question first.");
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
              choiceIndexes:
                lesson.contentType === "quiz" ? choiceIndexes : undefined,
            }),
          },
        );
        const data = (await response.json()) as {
          error?: string;
          nextLesson?: { id: string } | null;
          certificate?: { id: string } | null;
          justCertified?: boolean;
          attempt?: QuizAttempt | null;
          canRetry?: boolean;
        };

        if (!response.ok) {
          setError(data.error ?? "This lesson could not be completed.");
          if (data.attempt?.status) {
            setQuizAttemptStatus(data.attempt.status);
          } else if (data.canRetry) {
            setQuizAttemptStatus("failed");
          }
          if (data.canRetry) {
            router.refresh();
          }
          return;
        }

        if (data.justCertified && data.certificate?.id) {
          router.push(
            withConfirmed(`/student/learning/${courseId}/complete`, "certified"),
          );
        } else {
          const destination = data.nextLesson
            ? `/student/learning/${courseId}/lessons/${data.nextLesson.id}`
            : courseHref;
          router.push(withConfirmed(destination, "lesson-complete"));
        }
      } catch {
        setError("This lesson could not be completed. Check your connection.");
      }
    });
  }

  async function handleRetry() {
    setRetrying(true);
    setError("");
    try {
      const response = await fetch(
        `/api/learning/${courseId}/lessons/${lesson.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "retry" }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        attempt?: QuizAttempt;
      };
      if (!response.ok) {
        setError(data.error ?? "A new attempt could not be started.");
        return;
      }
      document
        .querySelectorAll<HTMLInputElement>(
          `input[name^="quiz-${lesson.id}-"]`,
        )
        .forEach((input) => {
          input.checked = false;
        });
      setQuizAttemptStatus(data.attempt?.status ?? "in_progress");
      router.refresh();
    } catch {
      setError("A new attempt could not be started. Check your connection.");
    } finally {
      setRetrying(false);
    }
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

  if (attemptClosed) {
    return (
      <div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="btn btn-primary"
        >
          {retrying ? (
            <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
          ) : null}
          {retrying ? "Starting…" : "Retry quiz"}
        </button>
        <p className="mt-2 text-sm text-muted">
          {quizAttemptStatus === "timed_out"
            ? "Time elapsed for this attempt."
            : "This attempt was not passed."}
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={confirm.busy || attemptClosed}
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
