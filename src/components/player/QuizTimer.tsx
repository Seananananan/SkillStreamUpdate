"use client";

import { Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { QuizAttempt } from "@/lib/types";

function remainingSeconds(expiresAt: string | null) {
  if (!expiresAt) return 0;
  const ends = Date.parse(expiresAt);
  if (!Number.isFinite(ends)) return 0;
  return Math.max(0, Math.ceil((ends - Date.now()) / 1000));
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function QuizTimer({
  attempt,
  courseId,
  lessonId,
  questionCount,
}: {
  attempt: QuizAttempt;
  courseId: string;
  lessonId: string;
  questionCount: number;
}) {
  const router = useRouter();
  const timeoutSent = useRef(false);
  const [seconds, setSeconds] = useState(() =>
    attempt.status === "in_progress" && attempt.expiresAt
      ? remainingSeconds(attempt.expiresAt)
      : 0,
  );

  useEffect(() => {
    timeoutSent.current = false;
  }, [attempt.id]);

  useEffect(() => {
    if (attempt.status !== "in_progress" || !attempt.expiresAt) return;
    function update() {
      setSeconds(remainingSeconds(attempt.expiresAt));
    }

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [attempt.expiresAt, attempt.status]);

  const elapsed = attempt.status !== "in_progress" || seconds === 0;

  useEffect(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      `input[name^="quiz-${lessonId}-"]`,
    );
    inputs.forEach((input) => {
      input.disabled = elapsed;
    });
  }, [elapsed, lessonId]);

  useEffect(() => {
    if (
      !attempt.expiresAt ||
      attempt.status !== "in_progress" ||
      seconds !== 0 ||
      timeoutSent.current
    ) {
      return;
    }
    timeoutSent.current = true;
    const choiceIndexes = Array.from({ length: questionCount }, (_, index) => {
      const selected = document.querySelector<HTMLInputElement>(
        `input[name="quiz-${lessonId}-${index}"]:checked`,
      );
      if (!selected) return null;
      const choice = Number(selected.value);
      return Number.isInteger(choice) ? choice : null;
    });
    void fetch(`/api/learning/${courseId}/lessons/${lessonId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "timed_out",
        attemptId: attempt.id,
        choiceIndexes,
      }),
    }).finally(() => router.refresh());
  }, [
    attempt.expiresAt,
    attempt.id,
    attempt.status,
    courseId,
    lessonId,
    questionCount,
    router,
    seconds,
  ]);

  const statusLabel =
    attempt.status === "failed"
      ? "Attempt failed"
      : attempt.status === "passed"
        ? "Quiz passed"
        : elapsed
          ? "Time elapsed"
          : "Time remaining";

  return (
    <div
      role="timer"
      aria-label={elapsed ? statusLabel : `${seconds} seconds remaining`}
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 ${
        elapsed ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-strong"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Clock3 aria-hidden="true" size={16} />
        {statusLabel} · Attempt {attempt.attemptNumber}
      </span>
      <span className="font-semibold tabular-nums">
        {elapsed ? "0:00" : formatTime(seconds)}
      </span>
    </div>
  );
}
