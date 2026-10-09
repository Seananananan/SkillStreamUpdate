import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CourseCover } from "@/components/dashboard/CourseCover";
import { EnrollmentBadge } from "@/components/EnrollmentBadge";
import { ProgressMeter } from "@/components/player/ProgressMeter";
import { requireRole } from "@/lib/auth";
import {
  canAccessLessons,
  courseAccessState,
  studentCourseActionLabel,
  studentCourseHref,
} from "@/lib/access";
import { listLearningForStudent } from "@/lib/db";
import { studentNav } from "@/lib/nav";

export default async function StudentLearningPage() {
  const session = await requireRole(["student"]);
  const enrolled = await listLearningForStudent(session.id);

  return (
    <AppShell
      user={session}
      title="My courses"
      subtitle="Open a course to work through lessons. Completing every lesson finishes the course."
      nav={studentNav}
      actions={
        <Link href="/student/courses" className="btn btn-secondary">
          Browse catalog
        </Link>
      }
    >
      {enrolled.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">You are not enrolled yet</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Open the catalog, pick a published course, and confirm your place.
            Access is set up after you enroll.
          </p>
          <Link href="/student/courses" className="btn btn-primary mt-4">
            Go to catalog
          </Link>
        </div>
      ) : (
        <section aria-labelledby="learning-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="learning-title" className="section-title">
              {enrolled.length} course{enrolled.length === 1 ? "" : "s"}
            </h2>
          </div>
          <ul className="divide-y divide-line">
            {enrolled.map(
              ({ enrollment, course, summary, certificate, lmsAccount }) => {
              const accessReady = canAccessLessons(enrollment, lmsAccount);
              const href = studentCourseHref(course.id, {
                accessReady,
                certificateId: certificate?.id,
                nextLessonId: summary.nextLesson?.id,
              });
              const action = studentCourseActionLabel({
                accessReady,
                completed: enrollment.status === "completed",
                started: summary.completed > 0,
              });

              return (
                <li
                  key={enrollment.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <CourseCover title={course.title} status={course.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{course.title}</p>
                    {course.status === "archived" ? (
                      <p className="mt-1 text-sm text-muted">
                        Archived — you keep access because you enrolled.
                      </p>
                    ) : null}
                    {!accessReady ? (
                      <p className="mt-1 text-sm text-muted">
                        {courseAccessState(lmsAccount) === "failed"
                          ? "Course access did not provision. Retry is Planned."
                          : "Setting up course access. Lessons open when it finishes."}
                      </p>
                    ) : null}
                    <div className="mt-2 max-w-md">
                      <ProgressMeter
                        completed={summary.completed}
                        total={summary.total}
                        percent={summary.percent}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <EnrollmentBadge status={enrollment.status} />
                    <Link href={href} className="btn btn-secondary">
                      {action}
                    </Link>
                    {certificate && accessReady ? (
                      <Link
                        href={`/student/certificates/${certificate.id}`}
                        className="btn btn-quiet"
                      >
                        Certificate
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            },
            )}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
