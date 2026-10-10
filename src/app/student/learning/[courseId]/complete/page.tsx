import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, BookOpen, RotateCcw, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth";
import { getCourseCompletionSummary } from "@/lib/db";
import { studentNav } from "@/lib/nav";

type PageProps = { params: Promise<{ courseId: string }> };

export default async function CourseCompletePage({ params }: PageProps) {
  const session = await requireRole(["student"]);
  const { courseId } = await params;
  const summary = await getCourseCompletionSummary(session.id, courseId);

  if (!summary) {
    notFound();
  }

  const completedOn = summary.enrollment.completedAt
    ? new Date(summary.enrollment.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Today";
  const quizCount = summary.quizzes.length;
  const trackedQuizzes = summary.quizzes.filter((quiz) => quiz.attemptCount > 0).length;

  return (
    <AppShell
      user={session}
      title="Course complete"
      subtitle={summary.course.title}
      nav={studentNav}
      actions={
        <Link href="/student/learning" className="btn btn-secondary">
          <ArrowLeft aria-hidden="true" size={16} />
          My courses
        </Link>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <section aria-label="Course results" className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <StatCard
              label="Lessons"
              value={`${summary.summary.completed}/${summary.summary.total}`}
              hint="Every lesson finished"
              icon={BookOpen}
              tone="success"
            />
          </div>
          <div className="card">
            <StatCard
              label="Finished"
              value={completedOn}
              hint="Course completion date"
              icon={Award}
              tone="brand"
            />
          </div>
          <div className="card">
            <StatCard
              label="Quizzes"
              value={quizCount}
              hint={
                quizCount === 0
                  ? "This course has no quizzes"
                  : `${summary.questionsAnswered} question${summary.questionsAnswered === 1 ? "" : "s"} across ${quizCount} quiz${quizCount === 1 ? "" : "zes"}`
              }
              icon={Target}
              tone={quizCount > 0 ? "brand" : "muted"}
            />
          </div>
          <div className="card">
            <StatCard
              label="First try"
              value={trackedQuizzes === 0 ? "—" : summary.firstTryPasses}
              hint={
                quizCount === 0
                  ? "No quizzes in this course"
                  : trackedQuizzes === 0
                    ? "Finished before attempts were tracked"
                    : summary.retried === 0
                      ? "Passed without a retry"
                      : `${summary.retried} quiz${summary.retried === 1 ? "" : "zes"} needed another attempt`
              }
              icon={RotateCcw}
              tone={summary.retried === 0 ? "success" : "warn"}
            />
          </div>
        </section>

        {quizCount > 0 ? (
          <section aria-labelledby="quiz-results-title" className="card">
            <div className="border-b border-line px-5 py-4">
              <h2 id="quiz-results-title" className="section-title">
                Quiz results
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {summary.quizzes.map((quiz) => (
                <li
                  key={quiz.lessonId}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">{quiz.title}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"}
                      {quiz.attemptCount > 0
                        ? ` · ${quiz.attemptCount} attempt${quiz.attemptCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {quiz.bestScore == null ? "No score" : `${quiz.bestScore}%`}
                    <span className="ml-2 font-normal text-muted">
                      {quiz.attemptCount === 0
                        ? "Completed"
                        : quiz.passedFirstTry
                          ? "First try"
                          : "Retried"}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {summary.certificate ? (
            <Link
              href={`/student/certificates/${summary.certificate.id}`}
              className="btn btn-primary"
            >
              View certificate
            </Link>
          ) : null}
          <Link
            href={`/student/learning/${summary.course.id}`}
            className="btn btn-secondary"
          >
            Course outline
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
