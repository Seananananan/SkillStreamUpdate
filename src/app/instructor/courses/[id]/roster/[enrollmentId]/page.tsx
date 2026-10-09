import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EnrollmentBadge } from "@/components/EnrollmentBadge";
import { ProgressMeter } from "@/components/player/ProgressMeter";
import { RevokeCertificateButton } from "@/components/RevokeCertificateButton";
import { requireRole } from "@/lib/auth";
import { getCourseById, getRosterDetail } from "@/lib/db";
import { instructorNav } from "@/lib/nav";
import { contentTypeLabels, getLessonProgressStatus } from "@/lib/player";
import { formatLastActivity, formatShortDate } from "@/lib/roster";

type PageProps = {
  params: Promise<{ id: string; enrollmentId: string }>;
};

const accessLabels = {
  pending: "Pending",
  provisioned: "Provisioned",
  failed: "Failed",
} as const;

export default async function RosterStudentPage({ params }: PageProps) {
  const session = await requireRole(["instructor"]);
  const { id, enrollmentId } = await params;
  const course = await getCourseById(id);

  if (!course || course.instructorId !== session.id) {
    notFound();
  }

  const detail = await getRosterDetail(course.id, enrollmentId);
  if (!detail) {
    notFound();
  }

  const {
    enrollment,
    student,
    summary,
    certificate,
    progress,
    lastActivityAt,
    needsAttention,
    attentionReason,
    lmsAccount,
  } = detail;

  return (
    <AppShell
      user={session}
      title={`${student.firstName} ${student.lastName}`}
      subtitle={course.title}
      nav={instructorNav}
      actions={
        <Link
          href={`/instructor/courses/${course.id}/roster`}
          className="btn btn-secondary"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to roster
        </Link>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="student-summary" className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="student-summary" className="section-title">
                Enrollment
              </h2>
              <p className="mt-1 text-sm text-muted">{student.email}</p>
            </div>
            <EnrollmentBadge status={enrollment.status} />
          </div>

          {needsAttention && attentionReason ? (
            <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
              {attentionReason}
            </p>
          ) : null}

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Enrolled</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {enrollment.enrolledAt
                  ? formatShortDate(enrollment.enrolledAt)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Last activity</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatLastActivity(lastActivityAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Completed</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {enrollment.completedAt
                  ? formatShortDate(enrollment.completedAt)
                  : "Not yet"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Course access</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {lmsAccount ? accessLabels[lmsAccount.syncStatus] : "Not provisioned"}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <ProgressMeter
              completed={summary.completed}
              total={summary.total}
              percent={summary.percent}
            />
          </div>

          {certificate ? (
            <div className="mt-4">
              <p className="text-sm">
                Certificate{" "}
                <Link
                  href={`/verify/${certificate.referenceNumber}`}
                  className="font-mono font-medium text-brand hover:text-brand-strong"
                >
                  {certificate.referenceNumber}
                </Link>
                {certificate.verificationStatus === "revoked" ? (
                  <span className="ml-2 text-danger">Revoked</span>
                ) : null}
              </p>
              {certificate.verificationStatus === "revoked" ? (
                <p className="mt-2 text-sm text-muted">
                  Public verify still finds this reference and shows it as
                  revoked.
                </p>
              ) : (
                <RevokeCertificateButton
                  courseId={course.id}
                  enrollmentId={enrollment.id}
                  referenceNumber={certificate.referenceNumber}
                />
              )}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="lessons-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="lessons-title" className="section-title">
              Lessons
            </h2>
          </div>
          {detail.course.modules.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">
              This course has no modules yet.
            </p>
          ) : (
            <ol className="divide-y divide-line">
              {detail.course.modules.map((courseModule, moduleIndex) => (
                <li key={courseModule.id} className="px-5 py-4">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">
                    {moduleIndex + 1}. {courseModule.title}
                  </p>
                  {courseModule.lessons.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">No lessons.</p>
                  ) : (
                    <ol className="mt-2 space-y-2">
                      {courseModule.lessons.map((lesson) => {
                        const status = getLessonProgressStatus(
                          progress,
                          lesson.id,
                        );
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {lesson.title}
                              </span>
                              <span className="text-muted">
                                {contentTypeLabels[lesson.contentType]}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5 text-muted">
                              {status === "completed" ? (
                                <>
                                  <Check
                                    aria-hidden="true"
                                    size={14}
                                    className="text-success"
                                  />
                                  <span>Complete</span>
                                </>
                              ) : status === "in_progress" ? (
                                "In progress"
                              ) : (
                                "Not started"
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </AppShell>
  );
}
